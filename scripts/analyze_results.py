#!/usr/bin/env python3
"""
Combine Claude Code commit counts with total GitHub commit counts
to calculate the actual percentage, month by month.
"""

import json

# Data collected from GitHub Search API

# Claude Code commits per month (max of URL-signature and author-email signals)
claude_data = {
    "2025-01": {"by_url": 302,     "by_author": 18,      },
    "2025-02": {"by_url": 1225,    "by_author": 19,      },
    "2025-03": {"by_url": 19540,   "by_author": 267,     },
    "2025-04": {"by_url": 16850,   "by_author": 293,     },
    "2025-05": {"by_url": 44480,   "by_author": 425,     },
    "2025-06": {"by_url": 261044,  "by_author": 3560,    },
    "2025-07": {"by_url": 476554,  "by_author": 5705,    },
    "2025-08": {"by_url": 590189,  "by_author": 7578,    },
    "2025-09": {"by_url": 502289,  "by_author": 7295,    },
    "2025-10": {"by_url": 123848,  "by_author": 89327,   },
    "2025-11": {"by_url": 114158,  "by_author": 764897,  },
    "2025-12": {"by_url": 119923,  "by_author": 457177,  },
    "2026-01": {"by_url": 201103,  "by_author": 541990,  },
    "2026-02": {"by_url": 306270,  "by_author": 281018,  },
}

# Total public commits per month from GitHub Search API
total_commits = {
    "2025-01": 97337577,
    "2025-02": 142134524,
    "2025-03": 125463225,
    "2025-04": 118550915,
    "2025-05": 127520825,
    "2025-06": 116835145,
    "2025-07": 129891837,
    "2025-08": 129447274,
    "2025-09": 139002495,
    "2025-10": 142887531,
    "2025-11": 149692399,
    "2025-12": 143537188,
    "2026-01": 153756997,
    "2026-02": 71306444,   # partial month (~14 days)
}

days_in_month = {
    "2025-01": 31, "2025-02": 28, "2025-03": 31, "2025-04": 30,
    "2025-05": 31, "2025-06": 30, "2025-07": 31, "2025-08": 31,
    "2025-09": 30, "2025-10": 31, "2025-11": 30, "2025-12": 31,
    "2026-01": 31, "2026-02": 14,  # partial
}

print()
print("=" * 100)
print("  GitHub Public Commits: Claude Code Contribution Analysis")
print("  Data source: GitHub Search API (search/commits)")
print("=" * 100)
print()

# Note about detection method shift
print("NOTE: Around Oct 2025, Claude Code shifted from URL-in-message signature to")
print("      Co-Authored-By author attribution. We use the LARGER of the two signals")
print("      per month. The real total may be higher (sum minus overlap).")
print()

print(f"{'Month':<10} {'Total Commits':>15} {'Daily Total':>13} {'Claude(URL)':>13} {'Claude(Auth)':>14} {'Claude Best':>13} {'Daily Claude':>13} {'Ratio':>8}")
print("-" * 103)

output = []

for month in sorted(claude_data.keys()):
    c = claude_data[month]
    t = total_commits[month]
    d = days_in_month[month]

    # Use the better signal for Claude count
    # Before Oct 2025: URL is dominant. After: author is dominant.
    # Some months both could miss commits, so we also show a "sum" estimate
    claude_best = max(c["by_url"], c["by_author"])

    daily_total = t / d
    daily_claude = claude_best / d
    pct = claude_best / t * 100 if t > 0 else 0

    print(f"{month:<10} {t:>15,} {daily_total:>13,.0f} {c['by_url']:>13,} {c['by_author']:>14,} {claude_best:>13,} {daily_claude:>13,.0f} {pct:>7.3f}%")

    output.append({
        "month": month,
        "total_commits": t,
        "daily_avg_total": round(daily_total),
        "claude_by_url": c["by_url"],
        "claude_by_author": c["by_author"],
        "claude_best_estimate": claude_best,
        "daily_avg_claude": round(daily_claude),
        "percentage": round(pct, 4),
        "days": d,
    })

print()
print("=" * 100)
print("  GROWTH SUMMARY")
print("=" * 100)
print()

# Show key milestones
for o in output:
    m = o["month"]
    bar_len = int(o["percentage"] * 100)  # scale for visibility
    bar = "█" * min(bar_len, 60) if bar_len > 0 else "▏"
    print(f"  {m}  {bar} {o['percentage']:.3f}%  ({o['daily_avg_claude']:,}/day)")

print()
print("Key observations:")
print(f"  - Jan 2025: ~{output[0]['daily_avg_claude']:,} Claude commits/day ({output[0]['percentage']:.3f}%)")
for o in output:
    if o["month"] == "2025-06":
        print(f"  - Jun 2025: ~{o['daily_avg_claude']:,} Claude commits/day ({o['percentage']:.3f}%) — first major inflection")
    if o["month"] == "2025-08":
        print(f"  - Aug 2025: ~{o['daily_avg_claude']:,} Claude commits/day ({o['percentage']:.3f}%) — peak (URL-based tracking)")
    if o["month"] == "2025-11":
        print(f"  - Nov 2025: ~{o['daily_avg_claude']:,} Claude commits/day ({o['percentage']:.3f}%) — author-based tracking surge")
latest = output[-1]
print(f"  - Feb 2026: ~{latest['daily_avg_claude']:,} Claude commits/day ({latest['percentage']:.3f}%) — latest")

print()
print("IMPORTANT CAVEATS:")
print("  1. GitHub Search API total_count is approximate for large result sets")
print("  2. Many Claude Code users disable the signature → these commits are INVISIBLE")
print("  3. The Oct 2025 detection method shift causes apparent dip — actual usage likely grew continuously")
print("  4. SemiAnalysis (using GH Archive/BigQuery raw data) reports 4% as of Feb 2026")
print("     Our API-based measurement shows ~0.4% — a ~10x undercount, likely because:")
print("     - Search API truncates total_count for very large result sets")
print("     - Not all attribution methods are captured by our two queries")
print("     - Some commits have signatures in trailers not indexed by commit search")
print()

# Save
with open("scripts/final_analysis.json", "w") as f:
    json.dump({"data": output}, f, indent=2)
print("Saved to scripts/final_analysis.json")
