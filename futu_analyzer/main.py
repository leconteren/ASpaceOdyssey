#!/usr/bin/env python3
"""
富途历史交易行为分析 - 主入口

使用前请确保:
1. 已安装 FutuOpenD 并启动: https://openapi.futunn.com/futu-api-doc/intro/FutuOpenDGuide.html
2. 已安装依赖: pip install -r futu_analyzer/requirements.txt
3. FutuOpenD 默认运行在 127.0.0.1:11111

使用方法:
    # 分析港股历史交易 (默认)
    python -m futu_analyzer.main

    # 分析美股历史交易
    python -m futu_analyzer.main --market US

    # 指定日期范围
    python -m futu_analyzer.main --start 2024-01-01 --end 2025-12-31

    # 分析所有市场
    python -m futu_analyzer.main --all-markets

    # 使用模拟环境
    python -m futu_analyzer.main --simulate

    # 导出 CSV
    python -m futu_analyzer.main --export

    # 盈亏分析 (需要行情数据)
    python -m futu_analyzer.main --pnl

    # 技术分析 (指定股票)
    python -m futu_analyzer.main --technical US.AAPL

    # 持仓组合分析
    python -m futu_analyzer.main --portfolio

    # 全部分析
    python -m futu_analyzer.main --full

    # 指定 OpenD 地址
    python -m futu_analyzer.main --host 192.168.1.100 --port 11111
"""

import argparse
import sys

from futu import TrdEnv

from .connection import FutuConnection
from .data_fetcher import TradeDataFetcher
from .analyzer import TradeAnalyzer
from .pnl_analyzer import PnLAnalyzer
from .technical_analyzer import TechnicalAnalyzer
from .portfolio_analyzer import PortfolioAnalyzer
from .report import (
    print_full_report,
    print_pnl_report,
    print_technical_report,
    print_portfolio_report,
    export_to_csv,
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="富途历史交易行为分析工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="FutuOpenD 地址 (默认: 127.0.0.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=11111,
        help="FutuOpenD 端口 (默认: 11111)",
    )
    parser.add_argument(
        "--market",
        default="HK",
        choices=["HK", "US", "CN"],
        help="交易市场 (默认: HK)",
    )
    parser.add_argument(
        "--all-markets",
        action="store_true",
        help="分析所有市场的交易记录",
    )
    parser.add_argument(
        "--start",
        default="",
        help="开始日期 YYYY-MM-DD",
    )
    parser.add_argument(
        "--end",
        default="",
        help="结束日期 YYYY-MM-DD",
    )
    parser.add_argument(
        "--simulate",
        action="store_true",
        help="使用模拟交易环境",
    )
    parser.add_argument(
        "--export",
        action="store_true",
        help="导出分析结果为 CSV 文件",
    )
    parser.add_argument(
        "--pnl",
        action="store_true",
        help="盈亏分析 (已实现盈亏 + 浮动盈亏)",
    )
    parser.add_argument(
        "--technical",
        metavar="CODE",
        default="",
        help="技术分析指定股票代码 (如 US.AAPL, HK.00700)",
    )
    parser.add_argument(
        "--kline-count",
        type=int,
        default=120,
        help="技术分析K线条数 (默认: 120)",
    )
    parser.add_argument(
        "--portfolio",
        action="store_true",
        help="持仓组合分析",
    )
    parser.add_argument(
        "--full",
        action="store_true",
        help="执行全部分析 (交易行为 + 盈亏 + 组合)",
    )
    return parser.parse_args()


def run_trade_analysis(fetcher, args):
    """交易行为分析"""
    print("正在获取历史成交记录...")
    if args.all_markets:
        deals = fetcher.get_all_market_deals(start=args.start, end=args.end)
    else:
        deals = fetcher.get_history_deals(
            market=args.market, start=args.start, end=args.end
        )

    if deals.empty:
        print("未获取到任何历史成交记录。")
        return None, deals

    print(f"获取到 {len(deals)} 条成交记录，正在分析...")
    analyzer = TradeAnalyzer(deals)
    report = analyzer.generate_full_report()
    print_full_report(report)
    return report, deals


def run_pnl_analysis(fetcher, deals, args):
    """盈亏分析"""
    print("正在获取持仓和行情数据...")

    positions = fetcher.get_positions(market=args.market)

    # 获取所有相关股票的实时行情
    code_set = set()
    if not deals.empty and "code" in deals.columns:
        code_set.update(deals["code"].unique())
    if not positions.empty and "code" in positions.columns:
        code_set.update(positions["code"].unique())

    quotes = pd.DataFrame()
    if code_set:
        code_list = list(code_set)
        # 分批获取 (Futu API 限制每次最多 400 个)
        for i in range(0, len(code_list), 400):
            batch = code_list[i : i + 400]
            try:
                batch_quotes = fetcher.get_realtime_quotes(batch)
                quotes = pd.concat([quotes, batch_quotes], ignore_index=True)
            except Exception as e:
                print(f"  获取部分行情失败: {e}")

    pnl = PnLAnalyzer(deals, positions, quotes)
    report = pnl.generate_pnl_report()
    print_pnl_report(report)
    return report


def run_technical_analysis(fetcher, code, kline_count):
    """技术分析"""
    print(f"正在获取 {code} 的K线数据...")
    kline = fetcher.get_kline(code, ktype="K_DAY", count=kline_count)
    if kline.empty:
        print(f"未获取到 {code} 的K线数据")
        return None

    name = ""
    try:
        snap = fetcher.get_realtime_quotes([code])
        if not snap.empty and "name" in snap.columns:
            name = snap.iloc[0]["name"]
    except Exception:
        pass

    ta = TechnicalAnalyzer(kline, code=code, name=name)
    report = ta.generate_technical_report()
    print_technical_report(report)
    return report


def run_portfolio_analysis(fetcher, args):
    """持仓组合分析"""
    print("正在获取持仓和账户数据...")

    positions = fetcher.get_positions(market=args.market)
    if positions.empty:
        print("当前无持仓")
        return None

    # 获取实时行情
    code_list = positions["code"].unique().tolist() if "code" in positions.columns else []
    quotes = pd.DataFrame()
    if code_list:
        try:
            quotes = fetcher.get_realtime_quotes(code_list)
        except Exception as e:
            print(f"  获取行情失败: {e}")

    account_info = pd.DataFrame()
    try:
        account_info = fetcher.get_account_info(market=args.market)
    except Exception as e:
        print(f"  获取账户信息失败: {e}")

    pa = PortfolioAnalyzer(positions, quotes, account_info)
    report = pa.generate_portfolio_report()
    print_portfolio_report(report)
    return report


def main():
    import pandas as pd

    args = parse_args()
    trd_env = TrdEnv.SIMULATE if args.simulate else TrdEnv.REAL

    # 判断要执行哪些分析
    do_trade = True  # 交易行为分析默认执行
    do_pnl = args.pnl or args.full
    do_technical = bool(args.technical)
    do_portfolio = args.portfolio or args.full

    print(f"正在连接 FutuOpenD ({args.host}:{args.port})...")

    with FutuConnection(host=args.host, port=args.port) as conn:
        fetcher = TradeDataFetcher(conn, trd_env=trd_env)

        # 1. 交易行为分析
        trade_report, deals = run_trade_analysis(fetcher, args)

        # 2. 盈亏分析
        pnl_report = None
        if do_pnl:
            pnl_report = run_pnl_analysis(fetcher, deals, args)

        # 3. 技术分析
        tech_report = None
        if do_technical:
            tech_report = run_technical_analysis(
                fetcher, args.technical, args.kline_count
            )

        # 4. 持仓组合分析
        portfolio_report = None
        if do_portfolio:
            portfolio_report = run_portfolio_analysis(fetcher, args)

        # 导出 CSV
        if args.export:
            all_exported = []
            if trade_report:
                all_exported.extend(export_to_csv(trade_report, "futu_trade"))
            if pnl_report:
                all_exported.extend(export_to_csv(pnl_report, "futu_pnl"))
            if portfolio_report:
                all_exported.extend(export_to_csv(portfolio_report, "futu_portfolio"))
            if all_exported:
                print("已导出以下文件:")
                for f in all_exported:
                    print(f"  - {f}")


if __name__ == "__main__":
    main()
