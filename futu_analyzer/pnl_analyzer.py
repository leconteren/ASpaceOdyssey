"""
盈亏分析模块
用实时/历史行情价格对比买入成本，计算每笔交易和整体的盈亏情况
"""

import pandas as pd
import numpy as np
from datetime import datetime
from collections import defaultdict


class PnLAnalyzer:
    """交易盈亏分析"""

    def __init__(self, deals: pd.DataFrame, positions: pd.DataFrame, quotes: pd.DataFrame):
        """
        Args:
            deals: 历史成交记录 (来自 TradeDataFetcher.get_history_deals)
            positions: 当前持仓 (来自 TradeDataFetcher.get_positions)
            quotes: 实时行情快照 (来自 TradeDataFetcher.get_realtime_quotes)
        """
        self.deals = deals.copy() if not deals.empty else pd.DataFrame()
        self.positions = positions.copy() if not positions.empty else pd.DataFrame()
        self.quotes = quotes.copy() if not quotes.empty else pd.DataFrame()
        self._preprocess()

    def _preprocess(self):
        if self.deals.empty:
            return
        if "create_time" in self.deals.columns:
            self.deals["create_time"] = pd.to_datetime(self.deals["create_time"])
        for col in ["qty", "price"]:
            if col in self.deals.columns:
                self.deals[col] = pd.to_numeric(self.deals[col], errors="coerce")

    def _get_current_price(self, code: str) -> float:
        """从行情快照中获取当前价"""
        if self.quotes.empty:
            return np.nan
        row = self.quotes[self.quotes["code"] == code]
        if row.empty:
            return np.nan
        return float(row.iloc[0].get("last_price", np.nan))

    def closed_pnl(self) -> pd.DataFrame:
        """
        已实现盈亏 - 对已平仓交易配对计算盈亏
        使用 FIFO（先进先出）方式匹配买卖
        """
        if self.deals.empty or "trd_side" not in self.deals.columns:
            return pd.DataFrame()

        results = []
        for code in self.deals["code"].unique():
            stock_deals = self.deals[self.deals["code"] == code].sort_values("create_time")
            stock_name = stock_deals["stock_name"].iloc[0] if "stock_name" in stock_deals.columns else code

            buy_queue = []  # [(qty, price, time), ...]

            for _, row in stock_deals.iterrows():
                qty = abs(row["qty"])
                price = row["price"]
                side = row["trd_side"]
                time = row.get("create_time", None)

                if side == "BUY":
                    buy_queue.append([qty, price, time])
                elif side == "SELL" and buy_queue:
                    remaining = qty
                    total_cost = 0.0
                    total_revenue = remaining * price
                    matched_qty = 0

                    while remaining > 0 and buy_queue:
                        bq, bp, bt = buy_queue[0]
                        match = min(remaining, bq)
                        total_cost += match * bp
                        matched_qty += match
                        remaining -= match
                        buy_queue[0][0] -= match
                        if buy_queue[0][0] <= 0:
                            buy_queue.pop(0)

                    if matched_qty > 0:
                        avg_cost = total_cost / matched_qty
                        pnl = total_revenue - total_cost
                        pnl_pct = (price / avg_cost - 1) * 100
                        results.append({
                            "代码": code,
                            "名称": stock_name,
                            "卖出数量": matched_qty,
                            "平均成本": round(avg_cost, 4),
                            "卖出价格": round(price, 4),
                            "已实现盈亏": round(pnl, 2),
                            "收益率%": round(pnl_pct, 2),
                            "卖出时间": time,
                        })

        if not results:
            return pd.DataFrame()

        return pd.DataFrame(results).sort_values("已实现盈亏", ascending=False)

    def unrealized_pnl(self) -> pd.DataFrame:
        """
        浮动盈亏 - 当前持仓相对成本的未实现盈亏
        优先使用持仓数据中的成本价，辅以实时行情
        """
        if self.positions.empty:
            return pd.DataFrame()

        results = []
        for _, pos in self.positions.iterrows():
            code = pos.get("code", "")
            stock_name = pos.get("stock_name", code)
            qty = float(pos.get("qty", 0))
            cost_price = float(pos.get("cost_price", 0))
            market_val = float(pos.get("market_val", 0))

            if qty <= 0:
                continue

            current_price = self._get_current_price(code)
            if pd.isna(current_price) and market_val > 0:
                current_price = market_val / qty

            if cost_price > 0 and not pd.isna(current_price):
                pnl = (current_price - cost_price) * qty
                pnl_pct = (current_price / cost_price - 1) * 100
            else:
                pnl = float(pos.get("pl_val", 0))
                pnl_pct = float(pos.get("pl_ratio", 0)) * 100 if "pl_ratio" in pos else 0

            results.append({
                "代码": code,
                "名称": stock_name,
                "持仓数量": int(qty),
                "成本价": round(cost_price, 4),
                "现价": round(current_price, 4) if not pd.isna(current_price) else "N/A",
                "市值": round(market_val, 2),
                "浮动盈亏": round(pnl, 2),
                "收益率%": round(pnl_pct, 2),
            })

        if not results:
            return pd.DataFrame()

        return pd.DataFrame(results).sort_values("浮动盈亏", ascending=False)

    def per_stock_pnl_summary(self) -> pd.DataFrame:
        """
        每只股票的综合盈亏汇总（已实现 + 浮动）
        """
        closed = self.closed_pnl()
        unrealized = self.unrealized_pnl()

        stock_pnl = {}

        if not closed.empty:
            for code, group in closed.groupby("代码"):
                name = group["名称"].iloc[0]
                stock_pnl[code] = {
                    "代码": code,
                    "名称": name,
                    "已实现盈亏": group["已实现盈亏"].sum(),
                    "平仓次数": len(group),
                    "浮动盈亏": 0.0,
                }

        if not unrealized.empty:
            for _, row in unrealized.iterrows():
                code = row["代码"]
                if code in stock_pnl:
                    stock_pnl[code]["浮动盈亏"] = row["浮动盈亏"]
                else:
                    stock_pnl[code] = {
                        "代码": code,
                        "名称": row["名称"],
                        "已实现盈亏": 0.0,
                        "平仓次数": 0,
                        "浮动盈亏": row["浮动盈亏"],
                    }

        if not stock_pnl:
            return pd.DataFrame()

        df = pd.DataFrame(stock_pnl.values())
        df["总盈亏"] = df["已实现盈亏"] + df["浮动盈亏"]
        return df.sort_values("总盈亏", ascending=False)

    def overall_summary(self) -> dict:
        """盈亏总览"""
        closed = self.closed_pnl()
        unrealized = self.unrealized_pnl()

        total_closed_pnl = closed["已实现盈亏"].sum() if not closed.empty else 0
        total_unrealized_pnl = unrealized["浮动盈亏"].sum() if not unrealized.empty else 0

        win_trades = len(closed[closed["已实现盈亏"] > 0]) if not closed.empty else 0
        lose_trades = len(closed[closed["已实现盈亏"] < 0]) if not closed.empty else 0
        total_trades = win_trades + lose_trades
        win_rate = round(win_trades / max(total_trades, 1) * 100, 1)

        avg_win = 0
        avg_loss = 0
        if not closed.empty:
            winners = closed[closed["已实现盈亏"] > 0]["已实现盈亏"]
            losers = closed[closed["已实现盈亏"] < 0]["已实现盈亏"]
            avg_win = round(winners.mean(), 2) if len(winners) > 0 else 0
            avg_loss = round(losers.mean(), 2) if len(losers) > 0 else 0

        profit_factor = round(abs(avg_win * win_trades) / max(abs(avg_loss * lose_trades), 1), 2)

        return {
            "已实现总盈亏": round(total_closed_pnl, 2),
            "浮动总盈亏": round(total_unrealized_pnl, 2),
            "综合盈亏": round(total_closed_pnl + total_unrealized_pnl, 2),
            "盈利交易数": win_trades,
            "亏损交易数": lose_trades,
            "胜率%": win_rate,
            "平均盈利": avg_win,
            "平均亏损": avg_loss,
            "盈亏比": profit_factor,
        }

    def generate_pnl_report(self) -> dict:
        """生成完整盈亏报告"""
        return {
            "盈亏总览": self.overall_summary(),
            "已实现盈亏明细": self.closed_pnl(),
            "浮动盈亏": self.unrealized_pnl(),
            "个股盈亏汇总": self.per_stock_pnl_summary(),
        }
