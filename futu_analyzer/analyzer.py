"""
交易行为分析模块
对历史交易数据进行多维度分析，生成交易行为报告
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict


class TradeAnalyzer:
    """分析历史交易行为"""

    def __init__(self, deals: pd.DataFrame):
        """
        Args:
            deals: 历史成交 DataFrame，包含富途 API 返回的字段
        """
        self.deals = deals.copy()
        self._preprocess()

    def _preprocess(self):
        """预处理数据"""
        if self.deals.empty:
            return

        # 确保时间列为 datetime 类型
        if "create_time" in self.deals.columns:
            self.deals["create_time"] = pd.to_datetime(self.deals["create_time"])
            self.deals["date"] = self.deals["create_time"].dt.date
            self.deals["hour"] = self.deals["create_time"].dt.hour
            self.deals["weekday"] = self.deals["create_time"].dt.day_name()
            self.deals["month"] = self.deals["create_time"].dt.to_period("M")

        # 确保数值列为数值类型
        for col in ["qty", "price", "deal_id"]:
            if col in self.deals.columns:
                self.deals[col] = pd.to_numeric(self.deals[col], errors="coerce")

    def summary(self) -> dict:
        """生成交易概览"""
        if self.deals.empty:
            return {"error": "无交易数据"}

        total_trades = len(self.deals)
        unique_stocks = self.deals["code"].nunique() if "code" in self.deals.columns else 0

        buys = self.deals[self.deals["trd_side"] == "BUY"] if "trd_side" in self.deals.columns else pd.DataFrame()
        sells = self.deals[self.deals["trd_side"] == "SELL"] if "trd_side" in self.deals.columns else pd.DataFrame()

        date_range = ""
        if "create_time" in self.deals.columns:
            min_date = self.deals["create_time"].min()
            max_date = self.deals["create_time"].max()
            date_range = f"{min_date.strftime('%Y-%m-%d')} ~ {max_date.strftime('%Y-%m-%d')}"
            trading_days = self.deals["date"].nunique()
        else:
            trading_days = 0

        return {
            "总成交笔数": total_trades,
            "买入笔数": len(buys),
            "卖出笔数": len(sells),
            "涉及股票数": unique_stocks,
            "活跃交易日": trading_days,
            "数据时间范围": date_range,
        }

    def stock_frequency(self, top_n: int = 20) -> pd.DataFrame:
        """
        股票交易频率排名

        Returns:
            按交易次数排名的股票 DataFrame
        """
        if self.deals.empty or "code" not in self.deals.columns:
            return pd.DataFrame()

        freq = (
            self.deals.groupby(["code", "stock_name"])
            .agg(
                交易次数=("deal_id", "count"),
                总成交量=("qty", "sum"),
            )
            .reset_index()
            .sort_values("交易次数", ascending=False)
            .head(top_n)
        )
        freq.columns = ["代码", "名称", "交易次数", "总成交量"]
        return freq

    def trading_time_distribution(self) -> dict:
        """分析交易时间分布"""
        if self.deals.empty or "hour" not in self.deals.columns:
            return {}

        hourly = self.deals.groupby("hour").size()
        weekday_order = [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
        ]
        weekly = (
            self.deals.groupby("weekday")
            .size()
            .reindex(weekday_order)
            .dropna()
        )

        peak_hour = hourly.idxmax()
        peak_day = weekly.idxmax() if not weekly.empty else "N/A"

        return {
            "每小时交易分布": hourly.to_dict(),
            "每周交易分布": weekly.to_dict(),
            "最活跃交易时段": f"{peak_hour}:00 - {peak_hour + 1}:00",
            "最活跃交易日": peak_day,
        }

    def monthly_activity(self) -> pd.DataFrame:
        """月度交易活跃度"""
        if self.deals.empty or "month" not in self.deals.columns:
            return pd.DataFrame()

        monthly = (
            self.deals.groupby("month")
            .agg(
                交易笔数=("deal_id", "count"),
                涉及股票数=("code", "nunique"),
                总成交量=("qty", "sum"),
            )
            .reset_index()
        )
        monthly.columns = ["月份", "交易笔数", "涉及股票数", "总成交量"]
        return monthly

    def buy_sell_analysis(self) -> dict:
        """买卖行为分析"""
        if self.deals.empty or "trd_side" not in self.deals.columns:
            return {}

        buys = self.deals[self.deals["trd_side"] == "BUY"]
        sells = self.deals[self.deals["trd_side"] == "SELL"]

        result = {
            "买入次数": len(buys),
            "卖出次数": len(sells),
            "买卖比": round(len(buys) / max(len(sells), 1), 2),
        }

        # 分析每只股票的买卖情况
        if "code" in self.deals.columns:
            stock_bs = (
                self.deals.groupby(["code", "trd_side"])
                .size()
                .unstack(fill_value=0)
            )
            if "BUY" in stock_bs.columns and "SELL" in stock_bs.columns:
                # 只买不卖的股票（可能是长期持有）
                buy_only = stock_bs[stock_bs["SELL"] == 0].index.tolist()
                # 频繁买卖的股票（短线交易）
                active = stock_bs[
                    (stock_bs.get("BUY", 0) >= 3) & (stock_bs.get("SELL", 0) >= 3)
                ].index.tolist()

                result["只买未卖股票数"] = len(buy_only)
                result["频繁交易股票数"] = len(active)
                result["只买未卖股票"] = buy_only[:10]
                result["频繁交易股票"] = active[:10]

        return result

    def holding_period_estimate(self) -> pd.DataFrame:
        """
        估算持仓周期
        通过匹配买入和卖出来估算每只股票的大致持仓天数
        """
        if self.deals.empty:
            return pd.DataFrame()

        required_cols = {"code", "trd_side", "create_time", "stock_name"}
        if not required_cols.issubset(self.deals.columns):
            return pd.DataFrame()

        results = []
        for code in self.deals["code"].unique():
            stock_deals = self.deals[self.deals["code"] == code].sort_values("create_time")
            stock_name = stock_deals["stock_name"].iloc[0]

            buys = stock_deals[stock_deals["trd_side"] == "BUY"]["create_time"].tolist()
            sells = stock_deals[stock_deals["trd_side"] == "SELL"]["create_time"].tolist()

            if buys and sells:
                # 简单匹配：用最早的买入和最早的卖出估算
                pairs = list(zip(buys, sells))
                holding_days = []
                for buy_time, sell_time in pairs:
                    if sell_time > buy_time:
                        delta = (sell_time - buy_time).days
                        holding_days.append(delta)

                if holding_days:
                    avg_days = np.mean(holding_days)
                    results.append({
                        "代码": code,
                        "名称": stock_name,
                        "交易对数": len(holding_days),
                        "平均持仓天数": round(avg_days, 1),
                        "最短持仓天数": min(holding_days),
                        "最长持仓天数": max(holding_days),
                    })

        if not results:
            return pd.DataFrame()

        df = pd.DataFrame(results).sort_values("平均持仓天数")
        return df

    def trading_style_assessment(self) -> dict:
        """
        交易风格评估
        基于交易数据推断用户的交易风格
        """
        if self.deals.empty:
            return {"风格": "数据不足，无法评估"}

        summary = self.summary()
        holding = self.holding_period_estimate()
        time_dist = self.trading_time_distribution()

        style = {}

        # 交易频率评估
        total = summary.get("总成交笔数", 0)
        days = summary.get("活跃交易日", 1)
        avg_daily = total / max(days, 1)

        if avg_daily > 5:
            style["交易频率"] = "高频交易者 - 日均超过5笔交易"
        elif avg_daily > 2:
            style["交易频率"] = "中频交易者 - 日均2-5笔交易"
        elif avg_daily > 0.5:
            style["交易频率"] = "低频交易者 - 日均不足2笔交易"
        else:
            style["交易频率"] = "极低频交易者 - 偶尔交易"

        # 持仓周期评估
        if not holding.empty:
            avg_hold = holding["平均持仓天数"].mean()
            if avg_hold < 3:
                style["持仓风格"] = f"超短线 - 平均持仓 {avg_hold:.1f} 天"
            elif avg_hold < 14:
                style["持仓风格"] = f"短线交易 - 平均持仓 {avg_hold:.1f} 天"
            elif avg_hold < 60:
                style["持仓风格"] = f"波段操作 - 平均持仓 {avg_hold:.1f} 天"
            elif avg_hold < 180:
                style["持仓风格"] = f"中线投资 - 平均持仓 {avg_hold:.1f} 天"
            else:
                style["持仓风格"] = f"长线投资 - 平均持仓 {avg_hold:.1f} 天"

        # 集中度评估
        unique_stocks = summary.get("涉及股票数", 0)
        if unique_stocks <= 5:
            style["分散度"] = f"高度集中 - 仅交易 {unique_stocks} 只股票"
        elif unique_stocks <= 15:
            style["分散度"] = f"适度集中 - 交易 {unique_stocks} 只股票"
        else:
            style["分散度"] = f"较为分散 - 交易 {unique_stocks} 只股票"

        # 交易时段偏好
        peak_time = time_dist.get("最活跃交易时段", "")
        if peak_time:
            style["时段偏好"] = f"最活跃于 {peak_time}"

        return style

    def generate_full_report(self) -> dict:
        """生成完整分析报告"""
        return {
            "交易概览": self.summary(),
            "交易风格评估": self.trading_style_assessment(),
            "买卖行为分析": self.buy_sell_analysis(),
            "交易时间分布": self.trading_time_distribution(),
            "股票交易频率TOP20": self.stock_frequency(20),
            "月度交易活跃度": self.monthly_activity(),
            "持仓周期估算": self.holding_period_estimate(),
        }
