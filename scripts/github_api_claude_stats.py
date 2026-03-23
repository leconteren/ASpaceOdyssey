#!/usr/bin/env python3
"""
Query GitHub Search API to count Claude Code commits by month,
and estimate total GitHub public commits using GH Archive BigQuery
public data or known baselines.

GitHub Search API:
  - Commit search: GET /search/commits?q=<query>
  - Returns total_count (capped at ~1M+ but still useful for trends)
  - Rate limit: 10 requests/min unauthenticated, 30/min authenticated

Strategy:
  1. Search for commits with "claude.ai/code" in message, by month
  2. Search for commits with author "noreply@anthropic.com", by month (catches Co-Authored-By)
  3. Deduplicate by taking the max of the two signals per month
  4. For total commits: use GitHub's known ~3.5M/day baseline and PushEvent data
"""

import json
import sys
import time
from datetime import datetime
from urllib.request import urlopen, Request
from urllib.error import HTTPError

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Accept": "application/vnd.github.cloak-preview+json",
    "User-Agent": "claude-code-tracker/1.0",
}

def search_commits_count(query: str, retries: int = 3) -> int | None:
    """Query GitHub search API and return total_count."""
    import urllib.parse
    encoded = urllib.parse.quote(query, safe=":")
    url = f"{GITHUB_API}/search/commits?q={encoded}&per_page=1"

    for attempt in range(retries):
        try:
            req = Request(url, headers=HEADERS)
            with urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                return data.get("total_count", 0)
        except HTTPError as e:
            if e.code == 403:
                # Rate limited — wait and retry
                reset = e.headers.get("X-RateLimit-Reset")
                if reset:
                    wait = max(int(reset) - int(time.time()), 1)
                    print(f"  Rate limited, waiting {wait}s ...", file=sys.stderr)
                    time.sleep(wait + 1)
                else:
                    print(f"  Rate limited, waiting 60s ...", file=sys.stderr)
                    time.sleep(60)
            elif e.code == 422:
                print(f"  [WARN] 422 for query: {query}", file=sys.stderr)
                return None
            else:
                print(f"  [RETRY {attempt+1}] HTTP {e.code}", file=sys.stderr)
                time.sleep(2 ** (attempt + 1))
        except Exception as e:
            print(f"  [RETRY {attempt+1}] {e}", file=sys.stderr)
            time.sleep(2 ** (attempt + 1))

    return None


def search_pushevents_count(date_range: str) -> int | None:
    """
    Use GitHub search to estimate total pushes.
    GitHub doesn't offer a direct 'count all commits' API,
    but we can search for very common commit patterns.
    """
    # Search for the most common commit message prefix to get a lower-bound proxy.
    # This won't give us total, but gives a relative trend.
    # We'll use a separate known baseline for absolute numbers.
    return None


def main():
    print("=" * 72)
    print("  GitHub API: Claude Code Commit Statistics by Month")
    print("=" * 72)
    print()

    # Define monthly ranges (past 13 months)
    months = []
    for year in [2025, 2026]:
        for month in range(1, 13):
            if year == 2025 and month < 1:
                continue
            if year == 2026 and month > 2:
                break
            # Build date range
            if month == 12:
                end = f"{year+1}-01-01"
            else:
                end = f"{year}-{month+1:02d}-01"
            start = f"{year}-{month:02d}-01"
            months.append((f"{year}-{month:02d}", start, end))

    # Only keep last 14 months
    months = months[-14:]

    print(f"Querying {len(months)} months of data...")
    print()

    results = []

    for month_label, start, end in months:
        # Query 1: commits containing "claude.ai/code" in message
        q1 = f"claude.ai/code committer-date:{start}..{end}"
        print(f"  [{month_label}] Searching: {q1} ...", end=" ", flush=True)
        count1 = search_commits_count(q1)
        print(f"{count1:,}" if count1 is not None else "failed")
        time.sleep(6)  # respect rate limit (~10 req/min)

        # Query 2: commits with Claude as author
        q2 = f"author-email:noreply@anthropic.com committer-date:{start}..{end}"
        print(f"  [{month_label}] Searching: {q2} ...", end=" ", flush=True)
        count2 = search_commits_count(q2)
        print(f"{count2:,}" if count2 is not None else "failed")
        time.sleep(6)

        # Take the larger number (some commits have both signals, some only one)
        claude_count = max(count1 or 0, count2 or 0)

        results.append({
            "month": month_label,
            "claude_by_url": count1,
            "claude_by_author": count2,
            "claude_combined": claude_count,
        })

    # --- Now estimate total commits ---
    # GitHub has ~3.5M daily public commits (source: GitHub Octoverse, various reports)
    # We use the known baseline and the SemiAnalysis data point to anchor:
    #   - Feb 2026: ~4% = Claude, ~134k Claude commits/day
    #   - That implies ~3.35M total commits/day
    # GitHub's commit volume has been growing ~15-20% year over year.
    # We'll use a simple model: 3.0M/day in early 2025, growing to 3.5M/day in early 2026.

    print()
    print("=" * 72)
    print("  RESULTS")
    print("=" * 72)
    print()

    # Daily total commit estimates by month (conservative model)
    daily_totals_estimate = {
        "2025-01": 2_900_000,
        "2025-02": 2_950_000,
        "2025-03": 3_000_000,
        "2025-04": 3_050_000,
        "2025-05": 3_100_000,
        "2025-06": 3_100_000,
        "2025-07": 3_100_000,
        "2025-08": 3_150_000,
        "2025-09": 3_200_000,
        "2025-10": 3_250_000,
        "2025-11": 3_300_000,
        "2025-12": 3_350_000,
        "2026-01": 3_400_000,
        "2026-02": 3_500_000,
    }

    print(f"{'Month':<10} {'Claude (URL)':>14} {'Claude (Author)':>16} {'Claude Total':>14} {'Est Daily Claude':>17} {'Est Daily All':>14} {'Claude %':>10}")
    print("-" * 100)

    output_data = []

    for r in results:
        m = r["month"]
        # Estimate days in month
        year, mo = int(m[:4]), int(m[5:])
        if mo == 2:
            days = 29 if year % 4 == 0 else 28
        elif mo in (4, 6, 9, 11):
            days = 30
        else:
            days = 31

        # For current month (Feb 2026), only ~14 days have passed
        if m == "2026-02":
            days = 14

        claude_total = r["claude_combined"]
        est_daily_claude = claude_total / days if days > 0 else 0
        est_daily_all = daily_totals_estimate.get(m, 3_200_000)
        pct = (est_daily_claude / est_daily_all * 100) if est_daily_all > 0 else 0

        url_str = f"{r['claude_by_url']:,}" if r['claude_by_url'] is not None else "N/A"
        author_str = f"{r['claude_by_author']:,}" if r['claude_by_author'] is not None else "N/A"

        print(f"{m:<10} {url_str:>14} {author_str:>16} {claude_total:>14,} {est_daily_claude:>17,.0f} {est_daily_all:>14,} {pct:>9.2f}%")

        output_data.append({
            "month": m,
            "claude_by_url": r["claude_by_url"],
            "claude_by_author": r["claude_by_author"],
            "claude_total_monthly": claude_total,
            "est_daily_claude": round(est_daily_claude),
            "est_daily_total": est_daily_all,
            "claude_percentage": round(pct, 3),
            "days_in_period": days,
        })

    print()
    print("Notes:")
    print("  - 'Claude (URL)': commits with 'claude.ai/code/' in message")
    print("  - 'Claude (Author)': commits by noreply@anthropic.com")
    print("  - 'Est Daily All': estimated from GitHub Octoverse baseline (~3-3.5M/day, ~15% YoY growth)")
    print("  - GitHub Search API total_count may undercount for very large result sets")
    print()

    # Save JSON
    output_path = "scripts/github_claude_stats.json"
    with open(output_path, "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "methodology": "GitHub Search API commit search with monthly date ranges",
            "total_commits_source": "Estimated from GitHub Octoverse ~3-3.5M daily public commits with ~15% YoY growth",
            "data": output_data,
        }, f, indent=2)
    print(f"Results saved to {output_path}")


if __name__ == "__main__":
    main()
