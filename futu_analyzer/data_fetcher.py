"""
历史交易数据获取模块
从 FutuOpenD 获取历史成交记录、持仓、账户信息等
"""

import pandas as pd
from futu import (
    RET_OK,
    TrdEnv,
    TrdMarket,
    TrdSide,
    SecurityFirm,
)
from .connection import FutuConnection


class TradeDataFetcher:
    """获取富途历史交易数据"""

    MARKET_MAP = {
        "HK": TrdMarket.HK,
        "US": TrdMarket.US,
        "CN": TrdMarket.CN,
        "HKCC": TrdMarket.HKCC,
        "FUTURES": TrdMarket.FUTURES,
    }

    def __init__(self, conn: FutuConnection, trd_env: TrdEnv = TrdEnv.REAL):
        self.conn = conn
        self.trd_env = trd_env

    def get_history_deals(
        self, market: str = "HK", start: str = "", end: str = ""
    ) -> pd.DataFrame:
        """
        获取历史成交记录

        Args:
            market: 市场代码 (HK/US/CN)
            start: 开始日期 YYYY-MM-DD
            end: 结束日期 YYYY-MM-DD

        Returns:
            DataFrame 包含历史成交记录
        """
        trd_market = self.MARKET_MAP.get(market.upper(), TrdMarket.HK)
        trade_ctx = self.conn.connect_trade(
            trd_env=self.trd_env, market=trd_market
        )

        ret, data = trade_ctx.history_deal_list_query(
            start=start or None,
            end=end or None,
        )

        if ret != RET_OK:
            raise RuntimeError(f"获取历史成交失败: {data}")

        return data

    def get_history_orders(
        self, market: str = "HK", start: str = "", end: str = ""
    ) -> pd.DataFrame:
        """
        获取历史订单

        Args:
            market: 市场代码
            start: 开始日期
            end: 结束日期

        Returns:
            DataFrame 包含历史订单
        """
        trd_market = self.MARKET_MAP.get(market.upper(), TrdMarket.HK)
        trade_ctx = self.conn.connect_trade(
            trd_env=self.trd_env, market=trd_market
        )

        ret, data = trade_ctx.history_order_list_query(
            start=start or None,
            end=end or None,
        )

        if ret != RET_OK:
            raise RuntimeError(f"获取历史订单失败: {data}")

        return data

    def get_positions(self, market: str = "HK") -> pd.DataFrame:
        """获取当前持仓"""
        trd_market = self.MARKET_MAP.get(market.upper(), TrdMarket.HK)
        trade_ctx = self.conn.connect_trade(
            trd_env=self.trd_env, market=trd_market
        )

        ret, data = trade_ctx.position_list_query()

        if ret != RET_OK:
            raise RuntimeError(f"获取持仓失败: {data}")

        return data

    def get_account_info(self, market: str = "HK") -> pd.DataFrame:
        """获取账户资金信息"""
        trd_market = self.MARKET_MAP.get(market.upper(), TrdMarket.HK)
        trade_ctx = self.conn.connect_trade(
            trd_env=self.trd_env, market=trd_market
        )

        ret, data = trade_ctx.accinfo_query()

        if ret != RET_OK:
            raise RuntimeError(f"获取账户信息失败: {data}")

        return data

    def get_all_market_deals(
        self, start: str = "", end: str = ""
    ) -> pd.DataFrame:
        """获取所有市场的历史成交，合并到一个 DataFrame"""
        all_deals = []

        for market_name, market_enum in self.MARKET_MAP.items():
            if market_name in ("HKCC", "FUTURES"):
                continue
            try:
                trade_ctx = self.conn.connect_trade(
                    trd_env=self.trd_env, market=market_enum
                )
                ret, data = trade_ctx.history_deal_list_query(
                    start=start or None,
                    end=end or None,
                )
                if ret == RET_OK and not data.empty:
                    data["market"] = market_name
                    all_deals.append(data)
            except Exception:
                continue

        if not all_deals:
            return pd.DataFrame()

        return pd.concat(all_deals, ignore_index=True)
