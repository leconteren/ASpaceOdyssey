"""
Futu OpenD 连接管理模块
负责与 FutuOpenD 网关建立和管理连接
"""

from futu import (
    OpenQuoteContext,
    OpenSecTradeContext,
    TrdEnv,
    TrdMarket,
    RET_OK,
)


class FutuConnection:
    """管理与 FutuOpenD 的连接"""

    def __init__(self, host: str = "127.0.0.1", port: int = 11111):
        self.host = host
        self.port = port
        self.quote_ctx = None
        self.trade_ctx = None

    def connect_quote(self) -> OpenQuoteContext:
        """建立行情连接"""
        self.quote_ctx = OpenQuoteContext(host=self.host, port=self.port)
        return self.quote_ctx

    def connect_trade(
        self,
        trd_env: TrdEnv = TrdEnv.REAL,
        market: TrdMarket = TrdMarket.HK,
    ) -> OpenSecTradeContext:
        """
        建立交易连接

        Args:
            trd_env: 交易环境 (REAL=真实, SIMULATE=模拟)
            market: 交易市场 (HK=港股, US=美股, CN=A股)
        """
        self.trade_ctx = OpenSecTradeContext(
            host=self.host,
            port=self.port,
            filter_trdmarket=market,
        )
        return self.trade_ctx

    def close(self):
        """关闭所有连接"""
        if self.quote_ctx:
            self.quote_ctx.close()
            self.quote_ctx = None
        if self.trade_ctx:
            self.trade_ctx.close()
            self.trade_ctx = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
