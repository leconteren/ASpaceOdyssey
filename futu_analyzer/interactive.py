#!/usr/bin/env python3
"""
富途交易分析 - 交互式菜单
运行: python -m futu_analyzer.interactive
"""

import sys

import pandas as pd
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
    print_section,
    print_dict,
    print_dataframe,
    export_to_csv,
)


def show_menu():
    print()
    print("┌──────────────────────────────────────────┐")
    print("│     富途交易分析工具 v2.0                 │")
    print("├──────────────────────────────────────────┤")
    print("│  === 交易行为分析 ===                     │")
    print("│  1. 生成完整交易行为报告                  │")
    print("│  2. 查看交易概览                          │")
    print("│  3. 查看交易风格评估                      │")
    print("│  4. 查看股票交易频率排名                  │")
    print("│  5. 查看月度交易活跃度                    │")
    print("│  6. 查看持仓周期估算                      │")
    print("│  7. 查看买卖行为分析                      │")
    print("│  8. 查看交易时间分布                      │")
    print("│  === 行情数据分析 ===                     │")
    print("│  a. 盈亏分析 (已实现+浮动)                │")
    print("│  b. 个股技术分析 (K线/指标/信号)          │")
    print("│  c. 持仓组合分析 (市值/行业/风险)         │")
    print("│  d. 全部行情分析 (a+b+c)                  │")
    print("│  === 其他 ===                             │")
    print("│  9. 导出 CSV 报告                         │")
    print("│  0. 退出                                  │")
    print("└──────────────────────────────────────────┘")
    return input("请选择: ").strip().lower()


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


def get_quotes_for_codes(fetcher, code_set):
    """分批获取实时行情"""
    quotes = pd.DataFrame()
    code_list = list(code_set)
    for i in range(0, len(code_list), 400):
        batch = code_list[i : i + 400]
        try:
            batch_quotes = fetcher.get_realtime_quotes(batch)
            quotes = pd.concat([quotes, batch_quotes], ignore_index=True)
        except Exception as e:
            print(f"  获取部分行情失败: {e}")
    return quotes


def do_pnl_analysis(fetcher, deals, market):
    """执行盈亏分析"""
    print("正在获取持仓和行情数据...")
    positions = fetcher.get_positions(market=market)

    code_set = set()
    if not deals.empty and "code" in deals.columns:
        code_set.update(deals["code"].unique())
    if not positions.empty and "code" in positions.columns:
        code_set.update(positions["code"].unique())

    quotes = get_quotes_for_codes(fetcher, code_set) if code_set else pd.DataFrame()

    pnl = PnLAnalyzer(deals, positions, quotes)
    report = pnl.generate_pnl_report()
    print_pnl_report(report)
    return report


def do_technical_analysis(fetcher):
    """执行技术分析"""
    code = input("请输入股票代码 (如 US.AAPL, HK.00700): ").strip()
    if not code:
        print("未输入代码")
        return None

    count_str = input("K线条数 [默认120]: ").strip()
    count = int(count_str) if count_str.isdigit() else 120

    print(f"正在获取 {code} 的K线数据...")
    try:
        kline = fetcher.get_kline(code, ktype="K_DAY", count=count)
    except Exception as e:
        print(f"获取K线失败: {e}")
        return None

    if kline.empty:
        print("未获取到K线数据")
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


def do_portfolio_analysis(fetcher, market):
    """执行持仓组合分析"""
    print("正在获取持仓和账户数据...")
    positions = fetcher.get_positions(market=market)
    if positions.empty:
        print("当前无持仓")
        return None

    code_list = positions["code"].unique().tolist() if "code" in positions.columns else []
    quotes = pd.DataFrame()
    if code_list:
        try:
            quotes = fetcher.get_realtime_quotes(code_list)
        except Exception as e:
            print(f"  获取行情失败: {e}")

    account_info = pd.DataFrame()
    try:
        account_info = fetcher.get_account_info(market=market)
    except Exception as e:
        print(f"  获取账户信息失败: {e}")

    pa = PortfolioAnalyzer(positions, quotes, account_info)
    report = pa.generate_portfolio_report()
    print_portfolio_report(report)
    return report


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
                print("（行情分析功能仍可使用）")

            analyzer = TradeAnalyzer(deals) if not deals.empty else None
            report = analyzer.generate_full_report() if analyzer else {}

            # 缓存各类报告
            pnl_report = None
            portfolio_report = None

            while True:
                choice = show_menu()

                # === 交易行为分析 ===
                if choice == "1":
                    if report:
                        print_full_report(report)
                    else:
                        print("无交易数据")

                elif choice == "2":
                    if "交易概览" in report:
                        print_section("交易概览")
                        print_dict(report["交易概览"])
                    else:
                        print("无数据")

                elif choice == "3":
                    if "交易风格评估" in report:
                        print_section("交易风格评估")
                        print_dict(report["交易风格评估"])
                    else:
                        print("无数据")

                elif choice == "4":
                    if "股票交易频率TOP20" in report:
                        print_section("股票交易频率 TOP 20")
                        print_dataframe(report["股票交易频率TOP20"])
                    else:
                        print("无数据")

                elif choice == "5":
                    if "月度交易活跃度" in report:
                        print_section("月度交易活跃度")
                        print_dataframe(report["月度交易活跃度"])
                    else:
                        print("无数据")

                elif choice == "6":
                    if "持仓周期估算" in report:
                        print_section("持仓周期估算")
                        print_dataframe(report["持仓周期估算"])
                    else:
                        print("无数据")

                elif choice == "7":
                    if "买卖行为分析" in report:
                        print_section("买卖行为分析")
                        print_dict(report["买卖行为分析"])
                    else:
                        print("无数据")

                elif choice == "8":
                    if "交易时间分布" in report:
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
                    else:
                        print("无数据")

                # === 行情数据分析 ===
                elif choice == "a":
                    actual_market = market if market != "ALL" else "HK"
                    pnl_report = do_pnl_analysis(fetcher, deals, actual_market)

                elif choice == "b":
                    do_technical_analysis(fetcher)

                elif choice == "c":
                    actual_market = market if market != "ALL" else "HK"
                    portfolio_report = do_portfolio_analysis(fetcher, actual_market)

                elif choice == "d":
                    actual_market = market if market != "ALL" else "HK"
                    print("\n" + "=" * 60)
                    print("  执行全部行情分析...")
                    print("=" * 60)
                    pnl_report = do_pnl_analysis(fetcher, deals, actual_market)
                    portfolio_report = do_portfolio_analysis(fetcher, actual_market)

                # === 其他 ===
                elif choice == "9":
                    all_exported = []
                    if report:
                        all_exported.extend(export_to_csv(report, "futu_trade"))
                    if pnl_report:
                        all_exported.extend(export_to_csv(pnl_report, "futu_pnl"))
                    if portfolio_report:
                        all_exported.extend(export_to_csv(portfolio_report, "futu_portfolio"))
                    if all_exported:
                        print("已导出:")
                        for f in all_exported:
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
