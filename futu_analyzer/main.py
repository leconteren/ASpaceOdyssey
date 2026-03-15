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

    # 指定 OpenD 地址
    python -m futu_analyzer.main --host 192.168.1.100 --port 11111
"""

import argparse
import sys

from futu import TrdEnv

from .connection import FutuConnection
from .data_fetcher import TradeDataFetcher
from .analyzer import TradeAnalyzer
from .report import print_full_report, export_to_csv


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
    return parser.parse_args()


def main():
    args = parse_args()
    trd_env = TrdEnv.SIMULATE if args.simulate else TrdEnv.REAL

    print(f"正在连接 FutuOpenD ({args.host}:{args.port})...")

    with FutuConnection(host=args.host, port=args.port) as conn:
        fetcher = TradeDataFetcher(conn, trd_env=trd_env)

        # 获取历史成交数据
        print("正在获取历史成交记录...")
        if args.all_markets:
            deals = fetcher.get_all_market_deals(
                start=args.start, end=args.end
            )
        else:
            deals = fetcher.get_history_deals(
                market=args.market, start=args.start, end=args.end
            )

        if deals.empty:
            print("未获取到任何历史成交记录。")
            print("请检查:")
            print("  1. FutuOpenD 是否已启动")
            print("  2. 是否已登录富途账号")
            print("  3. 日期范围内是否有交易记录")
            sys.exit(1)

        print(f"获取到 {len(deals)} 条成交记录，正在分析...")

        # 分析交易行为
        analyzer = TradeAnalyzer(deals)
        report = analyzer.generate_full_report()

        # 输出报告
        print_full_report(report)

        # 导出 CSV
        if args.export:
            files = export_to_csv(report)
            if files:
                print("已导出以下文件:")
                for f in files:
                    print(f"  - {f}")


if __name__ == "__main__":
    main()
