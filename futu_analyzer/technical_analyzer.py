"""
K线技术分析模块
拉取个股K线数据，计算技术指标，分析买卖点是否在关键技术位
"""

import pandas as pd
import numpy as np
from datetime import datetime


class TechnicalAnalyzer:
    """K线技术分析"""

    def __init__(self, kline: pd.DataFrame, code: str = "", name: str = ""):
        """
        Args:
            kline: K线 DataFrame (来自 TradeDataFetcher.get_kline)
            code: 股票代码
            name: 股票名称
        """
        self.kline = kline.copy()
        self.code = code
        self.name = name
        self._preprocess()

    def _preprocess(self):
        if self.kline.empty:
            return
        if "time_key" in self.kline.columns:
            self.kline["time_key"] = pd.to_datetime(self.kline["time_key"])
        for col in ["open", "close", "high", "low", "volume", "turnover"]:
            if col in self.kline.columns:
                self.kline[col] = pd.to_numeric(self.kline[col], errors="coerce")

    def calc_ma(self, periods: list = None) -> pd.DataFrame:
        """计算移动平均线"""
        if periods is None:
            periods = [5, 10, 20, 60, 120]
        df = self.kline.copy()
        for p in periods:
            if len(df) >= p:
                df[f"MA{p}"] = df["close"].rolling(window=p).mean().round(4)
        return df

    def calc_rsi(self, period: int = 14) -> pd.Series:
        """计算 RSI 指标"""
        if self.kline.empty or len(self.kline) < period + 1:
            return pd.Series(dtype=float)

        delta = self.kline["close"].diff()
        gain = delta.clip(lower=0)
        loss = (-delta).clip(lower=0)

        avg_gain = gain.rolling(window=period, min_periods=period).mean()
        avg_loss = loss.rolling(window=period, min_periods=period).mean()

        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        return rsi.round(2)

    def calc_macd(self, fast: int = 12, slow: int = 26, signal: int = 9) -> pd.DataFrame:
        """计算 MACD 指标"""
        if self.kline.empty or len(self.kline) < slow:
            return pd.DataFrame()

        close = self.kline["close"]
        ema_fast = close.ewm(span=fast, adjust=False).mean()
        ema_slow = close.ewm(span=slow, adjust=False).mean()

        dif = ema_fast - ema_slow
        dea = dif.ewm(span=signal, adjust=False).mean()
        macd_hist = (dif - dea) * 2

        return pd.DataFrame({
            "DIF": dif.round(4),
            "DEA": dea.round(4),
            "MACD柱": macd_hist.round(4),
        }, index=self.kline.index)

    def calc_bollinger(self, period: int = 20, std_dev: int = 2) -> pd.DataFrame:
        """计算布林带"""
        if self.kline.empty or len(self.kline) < period:
            return pd.DataFrame()

        close = self.kline["close"]
        mid = close.rolling(window=period).mean()
        std = close.rolling(window=period).std()

        return pd.DataFrame({
            "上轨": (mid + std_dev * std).round(4),
            "中轨": mid.round(4),
            "下轨": (mid - std_dev * std).round(4),
        }, index=self.kline.index)

    def support_resistance(self, lookback: int = 60) -> dict:
        """
        计算近期支撑位和阻力位
        使用近 N 根K线的高低点聚类
        """
        if self.kline.empty or len(self.kline) < 10:
            return {}

        recent = self.kline.tail(lookback)
        highs = recent["high"].values
        lows = recent["low"].values
        current = recent["close"].iloc[-1]

        # 找局部高点和低点
        local_highs = []
        local_lows = []
        for i in range(2, len(recent) - 2):
            if highs[i] > highs[i - 1] and highs[i] > highs[i - 2] and highs[i] > highs[i + 1] and highs[i] > highs[i + 2]:
                local_highs.append(highs[i])
            if lows[i] < lows[i - 1] and lows[i] < lows[i - 2] and lows[i] < lows[i + 1] and lows[i] < lows[i + 2]:
                local_lows.append(lows[i])

        # 在当前价上方的局部高点 -> 阻力位
        resistances = sorted([h for h in local_highs if h > current])[:3]
        # 在当前价下方的局部低点 -> 支撑位
        supports = sorted([l for l in local_lows if l < current], reverse=True)[:3]

        return {
            "当前价": round(current, 4),
            "支撑位": [round(s, 4) for s in supports],
            "阻力位": [round(r, 4) for r in resistances],
        }

    def current_signals(self) -> dict:
        """
        当前技术信号汇总
        """
        if self.kline.empty or len(self.kline) < 30:
            return {"信号": "数据不足"}

        signals = {}
        close = self.kline["close"]
        current = close.iloc[-1]

        # MA 趋势判断
        ma_df = self.calc_ma([5, 20, 60])
        last = ma_df.iloc[-1]

        if "MA5" in last and "MA20" in last:
            ma5 = last["MA5"]
            ma20 = last["MA20"]
            if not pd.isna(ma5) and not pd.isna(ma20):
                if ma5 > ma20:
                    signals["均线趋势"] = f"多头排列 (MA5={ma5:.2f} > MA20={ma20:.2f})"
                else:
                    signals["均线趋势"] = f"空头排列 (MA5={ma5:.2f} < MA20={ma20:.2f})"

        if "MA60" in last and not pd.isna(last["MA60"]):
            ma60 = last["MA60"]
            if current > ma60:
                signals["中期趋势"] = f"价格在60日均线上方 ({current:.2f} vs MA60={ma60:.2f})"
            else:
                signals["中期趋势"] = f"价格在60日均线下方 ({current:.2f} vs MA60={ma60:.2f})"

        # RSI
        rsi = self.calc_rsi()
        if len(rsi) > 0:
            current_rsi = rsi.iloc[-1]
            if not pd.isna(current_rsi):
                if current_rsi > 70:
                    signals["RSI"] = f"超买区间 ({current_rsi:.1f})"
                elif current_rsi < 30:
                    signals["RSI"] = f"超卖区间 ({current_rsi:.1f})"
                else:
                    signals["RSI"] = f"中性区间 ({current_rsi:.1f})"

        # MACD
        macd = self.calc_macd()
        if not macd.empty:
            last_macd = macd.iloc[-1]
            prev_macd = macd.iloc[-2] if len(macd) > 1 else None

            dif = last_macd["DIF"]
            dea = last_macd["DEA"]
            if dif > dea:
                signals["MACD"] = f"多头 (DIF={dif:.4f} > DEA={dea:.4f})"
            else:
                signals["MACD"] = f"空头 (DIF={dif:.4f} < DEA={dea:.4f})"

            if prev_macd is not None:
                if prev_macd["DIF"] <= prev_macd["DEA"] and dif > dea:
                    signals["MACD信号"] = "金叉 - 买入信号"
                elif prev_macd["DIF"] >= prev_macd["DEA"] and dif < dea:
                    signals["MACD信号"] = "死叉 - 卖出信号"

        # 布林带
        boll = self.calc_bollinger()
        if not boll.empty:
            last_boll = boll.iloc[-1]
            upper = last_boll["上轨"]
            lower = last_boll["下轨"]
            mid = last_boll["中轨"]
            if not pd.isna(upper):
                if current > upper:
                    signals["布林带"] = f"突破上轨 (价格{current:.2f} > 上轨{upper:.2f})"
                elif current < lower:
                    signals["布林带"] = f"跌破下轨 (价格{current:.2f} < 下轨{lower:.2f})"
                else:
                    pos = "偏上" if current > mid else "偏下"
                    signals["布林带"] = f"通道内{pos} (下轨{lower:.2f} < 价格{current:.2f} < 上轨{upper:.2f})"

        # 支撑阻力
        sr = self.support_resistance()
        if sr:
            signals["支撑阻力"] = sr

        return signals

    def evaluate_trade_timing(self, trade_date: str, trade_price: float, trade_side: str) -> dict:
        """
        评估某笔交易的技术面时机

        Args:
            trade_date: 交易日期 YYYY-MM-DD
            trade_price: 交易价格
            trade_side: BUY 或 SELL

        Returns:
            技术面评价
        """
        if self.kline.empty:
            return {"评价": "无K线数据"}

        trade_dt = pd.to_datetime(trade_date)

        # 找到交易日及之前的数据
        mask = self.kline["time_key"] <= trade_dt
        before = self.kline[mask]

        if len(before) < 20:
            return {"评价": "交易前K线数据不足"}

        # 临时替换 kline 做分析
        original_kline = self.kline
        self.kline = before

        evaluation = {"交易日期": trade_date, "交易价格": trade_price, "方向": trade_side}

        # RSI 判断
        rsi = self.calc_rsi()
        if len(rsi) > 0:
            rsi_val = rsi.iloc[-1]
            if not pd.isna(rsi_val):
                if trade_side == "BUY" and rsi_val < 30:
                    evaluation["RSI评价"] = f"良好 - 在超卖区买入 (RSI={rsi_val:.1f})"
                elif trade_side == "BUY" and rsi_val > 70:
                    evaluation["RSI评价"] = f"风险 - 在超买区买入 (RSI={rsi_val:.1f})"
                elif trade_side == "SELL" and rsi_val > 70:
                    evaluation["RSI评价"] = f"良好 - 在超买区卖出 (RSI={rsi_val:.1f})"
                elif trade_side == "SELL" and rsi_val < 30:
                    evaluation["RSI评价"] = f"风险 - 在超卖区卖出 (RSI={rsi_val:.1f})"
                else:
                    evaluation["RSI评价"] = f"中性 (RSI={rsi_val:.1f})"

        # MA 位置
        ma_df = self.calc_ma([20, 60])
        if len(ma_df) > 0:
            last_ma = ma_df.iloc[-1]
            ma20 = last_ma.get("MA20", np.nan)
            if not pd.isna(ma20):
                if trade_side == "BUY" and trade_price < ma20:
                    evaluation["均线评价"] = f"良好 - 在20日均线下方买入"
                elif trade_side == "SELL" and trade_price > ma20:
                    evaluation["均线评价"] = f"良好 - 在20日均线上方卖出"
                else:
                    evaluation["均线评价"] = "中性"

        self.kline = original_kline
        return evaluation

    def generate_technical_report(self) -> dict:
        """生成技术分析报告"""
        if self.kline.empty:
            return {"错误": "无K线数据"}

        report = {
            "股票": f"{self.code} {self.name}",
            "K线数据范围": f"{self.kline['time_key'].min()} ~ {self.kline['time_key'].max()}" if "time_key" in self.kline.columns else "N/A",
            "K线数量": len(self.kline),
            "当前技术信号": self.current_signals(),
        }

        sr = self.support_resistance()
        if sr:
            report["支撑阻力位"] = sr

        return report
