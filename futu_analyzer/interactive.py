#!/usr/bin/env python3
"""
富途交易分析 - 交互式菜单
运行: python -m futu_analyzer.interactive
"""

import sys

from futu import TrdEnv

from .connection import FutuConnection
from .data_fetcher import TradeDataFetcher
from .analyzer import TradeAnalyzer
from .report import (
    print_full_report,
    print_section,
    print_dict,
    print_dataframe,
    export_to_csv,
)


def show_menu():
    print()
    print("┌────────────────────────────────────┐")
    print("│     富途交易分析工具 v1.0          │")
    print("├────────────────────────────────────┤")
    print("│  1. 生成完整分析报告               │")
    print("│  2. 查看交易概览                   │")
    print("│  3. 查看交易风格评估               │")
    print("│  4. 查看股票交易频率排名           │")
    print("│  5. 查看月度交易活跃度             │")
    print("│  6. 查看持仓周期估算               │")
    print("│  7. 查看买卖行为分析               │")
    print("│  8. 查看交易时间分布               │")
    print("│  9. 导出 CSV 报告                  │")
    print("│  0. 退出                           │")
    print("└────────────────────────────────────┘")
    return input("请选择 [0-9]: ").strip()


def select_market():
    print()
    print("选择市场:")
    print("  1. 港股 (HK)")
    print("  2. 美股 (US)")
    print("  3. A股 (CN)")
    print("  4. 全部市场")
    choice = input("请选择 [1-4, 默认1]: ").strip() or "1"
    return {"1": "HK", "2": "US", "3": "CN", "4": "ALL"}.get(choice, "HK")


def select_date_range():
    print()
    start = input("开始日期 (YYYY-MM-DD, 留空不限): ").strip()
    end = input("结束日期 (YYYY-MM-DD, 留空不限): ").strip()
    return start, end


def fetch_deals(fetcher, market, start, end):
    print("正在获取历史成交记录...")
    if market == "ALL":
        return fetcher.get_all_market_deals(start=start, end=end)
    return fetcher.get_history_deals(market=market, start=start, end=end)


def main():
    host = "127.0.0.1"
    port = 11111

    # 支持命令行指定地址
    for i, arg in enumerate(sys.argv[1:], 1):
        if arg == "--host" and i < len(sys.argv):
            host = sys.argv[i + 1]
        elif arg == "--port" and i < len(sys.argv):
            port = int(sys.argv[i + 1])

    print(f"正在连接 FutuOpenD ({host}:{port})...")

    try:
        with FutuConnection(host=host, port=port) as conn:
            print("连接成功!")

            market = select_market()
            start, end = select_date_range()

            fetcher = TradeDataFetcher(conn, trd_env=TrdEnv.REAL)
            deals = fetch_deals(fetcher, market, start, end)

            if deals.empty:
                print("未获取到任何历史成交记录。")
                sys.exit(1)

            print(f"获取到 {len(deals)} 条成交记录。")
            analyzer = TradeAnalyzer(deals)
            report = analyzer.generate_full_report()

            while True:
                choice = show_menu()

                if choice == "1":
                    print_full_report(report)

                elif choice == "2":
                    print_section("交易概览")
                    print_dict(report["交易概览"])

                elif choice == "3":
                    print_section("交易风格评估")
                    print_dict(report["交易风格评估"])

                elif choice == "4":
                    print_section("股票交易频率 TOP 20")
                    print_dataframe(report["股票交易频率TOP20"])

                elif choice == "5":
                    print_section("月度交易活跃度")
                    print_dataframe(report["月度交易活跃度"])

                elif choice == "6":
                    print_section("持仓周期估算")
                    print_dataframe(report["持仓周期估算"])

                elif choice == "7":
                    print_section("买卖行为分析")
                    print_dict(report["买卖行为分析"])

                elif choice == "8":
                    print_section("交易时间分布")
                    time_data = report["交易时间分布"]
                    for key in ("最活跃交易时段", "最活跃交易日"):
                        if key in time_data:
                            print(f"  {key}: {time_data[key]}")
                    if "每小时交易分布" in time_data:
                        print("\n  每小时交易量:")
                        hourly = time_data["每小时交易分布"]
                        max_val = max(hourly.values()) if hourly else 1
                        for hour, count in sorted(hourly.items()):
                            bar = "█" * int(count / max_val * 30)
                            print(f"    {hour:02d}:00  {bar} {count}")

                elif choice == "9":
                    files = export_to_csv(report)
                    if files:
                        print("已导出:")
                        for f in files:
                            print(f"  - {f}")
                    else:
                        print("无数据可导出。")

                elif choice == "0":
                    print("再见!")
                    break

                else:
                    print("无效选择，请重新输入。")

    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
