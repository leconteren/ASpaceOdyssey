"""
持仓组合分析模块
用实时行情计算当前持仓的市值占比、行业分布、风险敞口
"""

import pandas as pd
import numpy as np


class PortfolioAnalyzer:
    """持仓组合分析"""

    def __init__(self, positions: pd.DataFrame, quotes: pd.DataFrame, account_info: pd.DataFrame = None):
        """
        Args:
            positions: 当前持仓 (来自 TradeDataFetcher.get_positions)
            quotes: 实时行情快照 (来自 TradeDataFetcher.get_realtime_quotes)
            account_info: 账户信息 (来自 TradeDataFetcher.get_account_info)
        """
        self.positions = positions.copy() if not positions.empty else pd.DataFrame()
        self.quotes = quotes.copy() if not quotes.empty else pd.DataFrame()
        self.account_info = account_info.copy() if account_info is not None and not account_info.empty else pd.DataFrame()
        self._preprocess()

    def _preprocess(self):
        if self.positions.empty:
            return
        for col in ["qty", "cost_price", "market_val", "pl_val", "pl_ratio"]:
            if col in self.positions.columns:
                self.positions[col] = pd.to_numeric(self.positions[col], errors="coerce")

    def market_value_breakdown(self) -> pd.DataFrame:
        """
        市值占比分析
        """
        if self.positions.empty:
            return pd.DataFrame()

        active = self.positions[self.positions["qty"] > 0].copy()
        if active.empty:
            return pd.DataFrame()

        total_mv = active["market_val"].sum()
        if total_mv <= 0:
            return pd.DataFrame()

        active["市值占比%"] = (active["market_val"] / total_mv * 100).round(2)

        result = active[["code", "stock_name", "qty", "cost_price", "market_val"]].copy()
        result.columns = ["代码", "名称", "持仓数量", "成本价", "市值"]
        result["市值占比%"] = active["市值占比%"].values
        result["盈亏"] = active["pl_val"].values if "pl_val" in active.columns else 0
        result["收益率%"] = (active["pl_ratio"].values * 100).round(2) if "pl_ratio" in active.columns else 0

        return result.sort_values("市值占比%", ascending=False).reset_index(drop=True)

    def sector_distribution(self) -> pd.DataFrame:
        """
        行业分布（基于行情快照中的行业信息）
        """
        if self.positions.empty or self.quotes.empty:
            return pd.DataFrame()

        active = self.positions[self.positions["qty"] > 0].copy()
        if active.empty:
            return pd.DataFrame()

        # 合并行情数据获取行业信息
        merged = active.merge(
            self.quotes[["code", "plate_name"]].drop_duplicates() if "plate_name" in self.quotes.columns else pd.DataFrame(columns=["code", "plate_name"]),
            on="code",
            how="left",
        )

        if "plate_name" not in merged.columns or merged["plate_name"].isna().all():
            # 如果没有行业信息，尝试用 stock_name 中的市场前缀粗分
            merged["行业"] = merged.get("code", pd.Series(dtype=str)).apply(
                lambda x: self._infer_sector(x) if isinstance(x, str) else "其他"
            )
        else:
            merged["行业"] = merged["plate_name"].fillna("未分类")

        sector = (
            merged.groupby("行业")
            .agg(
                持仓数=("code", "count"),
                总市值=("market_val", "sum"),
            )
            .reset_index()
        )
        total = sector["总市值"].sum()
        sector["占比%"] = (sector["总市值"] / max(total, 1) * 100).round(2)

        return sector.sort_values("占比%", ascending=False).reset_index(drop=True)

    @staticmethod
    def _infer_sector(code: str) -> str:
        """根据代码前缀粗略判断市场"""
        if code.startswith("US."):
            return "美股"
        elif code.startswith("HK."):
            return "港股"
        elif code.startswith("SH.") or code.startswith("SZ."):
            return "A股"
        return "其他"

    def concentration_analysis(self) -> dict:
        """
        集中度分析
        """
        breakdown = self.market_value_breakdown()
        if breakdown.empty:
            return {"分析": "无持仓数据"}

        total_mv = breakdown["市值"].sum()
        n_stocks = len(breakdown)

        result = {
            "持仓股票数": n_stocks,
            "总市值": round(total_mv, 2),
        }

        # 前N名集中度
        if n_stocks >= 1:
            top1_pct = breakdown.iloc[0]["市值占比%"]
            result["第一大持仓"] = f"{breakdown.iloc[0]['名称']} ({top1_pct}%)"

        if n_stocks >= 3:
            top3_pct = breakdown.head(3)["市值占比%"].sum()
            result["前3大持仓占比%"] = round(top3_pct, 2)

        if n_stocks >= 5:
            top5_pct = breakdown.head(5)["市值占比%"].sum()
            result["前5大持仓占比%"] = round(top5_pct, 2)

        # 赫芬达尔指数 (HHI) - 集中度量化
        weights = breakdown["市值占比%"] / 100
        hhi = (weights ** 2).sum()
        result["HHI指数"] = round(hhi, 4)

        if hhi > 0.25:
            result["集中度评价"] = "高度集中 - 组合风险较大"
        elif hhi > 0.15:
            result["集中度评价"] = "适度集中"
        elif hhi > 0.06:
            result["集中度评价"] = "适度分散"
        else:
            result["集中度评价"] = "高度分散"

        return result

    def risk_metrics(self) -> dict:
        """
        风险敞口分析
        """
        breakdown = self.market_value_breakdown()
        if breakdown.empty:
            return {"分析": "无持仓数据"}

        result = {}

        # 盈亏分布
        if "收益率%" in breakdown.columns:
            returns = breakdown["收益率%"]
            result["持仓平均收益率%"] = round(returns.mean(), 2)
            result["收益率标准差%"] = round(returns.std(), 2)
            result["最高收益率%"] = round(returns.max(), 2)
            result["最低收益率%"] = round(returns.min(), 2)

            # 亏损持仓
            losers = breakdown[breakdown["收益率%"] < 0]
            result["亏损持仓数"] = len(losers)
            if len(losers) > 0:
                result["亏损总额"] = round(losers["盈亏"].sum(), 2)

            # 盈利持仓
            winners = breakdown[breakdown["收益率%"] > 0]
            result["盈利持仓数"] = len(winners)
            if len(winners) > 0:
                result["盈利总额"] = round(winners["盈亏"].sum(), 2)

        # 账户层面
        if not self.account_info.empty:
            info = self.account_info.iloc[0]
            total_assets = float(info.get("total_assets", 0))
            cash = float(info.get("cash", 0))
            market_val = float(info.get("market_val", 0))

            if total_assets > 0:
                result["总资产"] = round(total_assets, 2)
                result["现金"] = round(cash, 2)
                result["持仓市值"] = round(market_val, 2)
                result["仓位比例%"] = round(market_val / total_assets * 100, 2)
                result["现金比例%"] = round(cash / total_assets * 100, 2)

        return result

    def generate_portfolio_report(self) -> dict:
        """生成组合分析报告"""
        return {
            "市值占比明细": self.market_value_breakdown(),
            "行业分布": self.sector_distribution(),
            "集中度分析": self.concentration_analysis(),
            "风险敞口": self.risk_metrics(),
        }
