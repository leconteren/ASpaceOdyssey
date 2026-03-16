"""
历史交易数据获取模块
从 FutuOpenD 获取历史成交记录、持仓、账户信息、行情数据等
"""

import pandas as pd
from futu import (
    RET_OK,
    TrdEnv,
    TrdMarket,
    TrdSide,
    SecurityFirm,
    KLType,
    KL_FIELD,
    SubType,
    AuType,
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

    # ========== 行情数据接口 ==========

    def get_realtime_quotes(self, code_list: list) -> pd.DataFrame:
        """
        获取实时行情快照

        Args:
            code_list: 股票代码列表，如 ["US.AAPL", "US.TSLA"]

        Returns:
            DataFrame 包含最新价、涨跌幅等
        """
        quote_ctx = self.conn.connect_quote()
        ret, data = quote_ctx.get_market_snapshot(code_list)
        if ret != RET_OK:
            raise RuntimeError(f"获取实时行情失败: {data}")
        return data

    def get_kline(
        self,
        code: str,
        ktype: str = "K_DAY",
        count: int = 120,
        autype: str = "qfq",
        start: str = "",
        end: str = "",
    ) -> pd.DataFrame:
        """
        获取K线数据

        Args:
            code: 股票代码，如 "US.AAPL"
            ktype: K线类型 (K_DAY/K_WEEK/K_MON/K_60M 等)
            count: 获取条数 (start/end 为空时生效)
            autype: 复权类型 (qfq=前复权, hfq=后复权, None=不复权)
            start: 开始日期 YYYY-MM-DD
            end: 结束日期 YYYY-MM-DD

        Returns:
            DataFrame 包含 OHLCV 数据
        """
        kl_type_map = {
            "K_1M": KLType.K_1M,
            "K_5M": KLType.K_5M,
            "K_15M": KLType.K_15M,
            "K_30M": KLType.K_30M,
            "K_60M": KLType.K_60M,
            "K_DAY": KLType.K_DAY,
            "K_WEEK": KLType.K_WEEK,
            "K_MON": KLType.K_MON,
        }
        au_type_map = {
            "qfq": AuType.QFQ,
            "hfq": AuType.HFQ,
            "none": AuType.NONE,
        }

        kl = kl_type_map.get(ktype.upper(), KLType.K_DAY)
        au = au_type_map.get(str(autype).lower(), AuType.QFQ)

        quote_ctx = self.conn.connect_quote()

        if start and end:
            ret, data, _ = quote_ctx.request_history_kline(
                code, start=start, end=end, ktype=kl, autype=au, max_count=1000
            )
        else:
            ret, data, _ = quote_ctx.request_history_kline(
                code, ktype=kl, autype=au, max_count=count
            )

        if ret != RET_OK:
            raise RuntimeError(f"获取K线失败 ({code}): {data}")

        return data

    def get_stock_basicinfo(self, code_list: list) -> pd.DataFrame:
        """获取股票基本信息（行业、市值等）"""
        quote_ctx = self.conn.connect_quote()
        ret, data = quote_ctx.get_market_snapshot(code_list)
        if ret != RET_OK:
            raise RuntimeError(f"获取股票信息失败: {data}")
        return data
