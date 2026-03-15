"""
报告输出模块
将分析结果格式化输出到终端或文件
"""

import pandas as pd
from tabulate import tabulate


def print_section(title: str, width: int = 60):
    """打印分隔区块标题"""
    print()
    print("=" * width)
    print(f"  {title}")
    print("=" * width)


def print_dict(data: dict, indent: int = 2):
    """格式化打印字典"""
    prefix = " " * indent
    for key, value in data.items():
        if isinstance(value, list):
            print(f"{prefix}{key}:")
            for item in value:
                print(f"{prefix}  - {item}")
        elif isinstance(value, dict):
            print(f"{prefix}{key}:")
            print_dict(value, indent + 2)
        else:
            print(f"{prefix}{key}: {value}")


def print_dataframe(df: pd.DataFrame):
    """用表格格式打印 DataFrame"""
    if df.empty:
        print("  (无数据)")
        return
    print(tabulate(df, headers="keys", tablefmt="simple", showindex=False))


def print_full_report(report: dict):
    """打印完整分析报告"""

    print()
    print("╔" + "═" * 58 + "╗")
    print("║" + "  富途历史交易行为分析报告".center(46) + "║")
    print("╚" + "═" * 58 + "╝")

    # 1. 交易概览
    if "交易概览" in report:
        print_section("📊 交易概览")
        print_dict(report["交易概览"])

    # 2. 交易风格评估
    if "交易风格评估" in report:
        print_section("🎯 交易风格评估")
        print_dict(report["交易风格评估"])

    # 3. 买卖行为分析
    if "买卖行为分析" in report:
        print_section("📈 买卖行为分析")
        print_dict(report["买卖行为分析"])

    # 4. 交易时间分布
    if "交易时间分布" in report:
        print_section("🕐 交易时间分布")
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

    # 5. 股票交易频率
    if "股票交易频率TOP20" in report:
        print_section("🏆 股票交易频率 TOP 20")
        df = report["股票交易频率TOP20"]
        print_dataframe(df)

    # 6. 月度活跃度
    if "月度交易活跃度" in report:
        print_section("📅 月度交易活跃度")
        df = report["月度交易活跃度"]
        print_dataframe(df)

    # 7. 持仓周期
    if "持仓周期估算" in report:
        print_section("⏱️  持仓周期估算")
        df = report["持仓周期估算"]
        print_dataframe(df)

    print()
    print("-" * 60)
    print("  报告生成完毕")
    print("-" * 60)
    print()


def export_to_csv(report: dict, prefix: str = "futu_analysis"):
    """将分析结果导出为 CSV 文件"""
    exported = []

    for key, value in report.items():
        if isinstance(value, pd.DataFrame) and not value.empty:
            filename = f"{prefix}_{key}.csv"
            value.to_csv(filename, index=False, encoding="utf-8-sig")
            exported.append(filename)

    return exported
