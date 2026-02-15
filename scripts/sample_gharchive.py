#!/usr/bin/env python3
"""
Sample GH Archive data to estimate Claude Code's share of GitHub public commits.

GH Archive (gharchive.org) records all public GitHub events as hourly JSON files.
This script downloads sample hours across the past year, parses PushEvents,
and counts total commits vs commits with Claude Code signatures.

Approach:
  - For each month, sample several hours spread across different days/times
  - Count total commits from PushEvent payloads
  - Detect Claude Code commits by signature in commit messages:
      1. "claude.ai/code/" URL in message
      2. "Co-Authored-By: Claude <noreply@anthropic.com>" trailer
  - Extrapolate hourly samples to daily estimates
"""

import gzip
import json
import re
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta
from io import BytesIO
from urllib.request import urlopen, Request
from urllib.error import HTTPError, URLError

# Claude Code signatures
CLAUDE_PATTERNS = [
    re.compile(r"claude\.ai/code/"),
    re.compile(r"Co-Authored-By:\s*Claude\s*<noreply@anthropic\.com>", re.IGNORECASE),
]

def is_claude_commit(message: str) -> bool:
    """Check if a commit message has Claude Code signature."""
    for pat in CLAUDE_PATTERNS:
        if pat.search(message):
            return True
    return False

def fetch_gharchive_hour(date_str: str, hour: int, retries: int = 3) -> dict | None:
    """
    Download and parse one hour of GH Archive data.
    Returns {"total_commits": N, "claude_commits": N, "push_events": N} or None on failure.
    """
    url = f"https://data.gharchive.org/{date_str}-{hour}.json.gz"

    for attempt in range(retries):
        try:
            req = Request(url, headers={"User-Agent": "claude-code-tracker/1.0"})
            with urlopen(req, timeout=120) as resp:
                compressed = resp.read()

            data = gzip.decompress(compressed)

            total_commits = 0
            claude_commits = 0
            push_events = 0

            for line in data.decode("utf-8", errors="replace").split("\n"):
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if event.get("type") != "PushEvent":
                    continue

                push_events += 1
                commits = event.get("payload", {}).get("commits", [])

                for commit in commits:
                    total_commits += 1
                    msg = commit.get("message", "")
                    if is_claude_commit(msg):
                        claude_commits += 1

            return {
                "total_commits": total_commits,
                "claude_commits": claude_commits,
                "push_events": push_events,
            }

        except HTTPError as e:
            if e.code == 404:
                print(f"  [SKIP] {url} — 404 Not Found", file=sys.stderr)
                return None
            print(f"  [RETRY {attempt+1}] {url} — HTTP {e.code}", file=sys.stderr)
        except (URLError, TimeoutError, OSError) as e:
            print(f"  [RETRY {attempt+1}] {url} — {e}", file=sys.stderr)

        if attempt < retries - 1:
            time.sleep(2 ** (attempt + 1))

    print(f"  [FAIL] {url} — gave up after {retries} retries", file=sys.stderr)
    return None

def generate_sample_points():
    """
    Generate (date_str, hour) pairs to sample.
    Strategy: for each month in the past 13 months, sample 3 different
    days at varied hours to get a representative picture.
    """
    samples = []
    now = datetime(2026, 2, 14)  # yesterday to ensure data availability

    # Go back 13 months
    for months_ago in range(0, 14):
        year = now.year
        month = now.month - months_ago
        while month <= 0:
            month += 12
            year -= 1

        # Sample 3 days per month at different hours
        # Day 5 at hour 10 (UTC morning), Day 15 at hour 18 (UTC evening), Day 25 at hour 3 (UTC night)
        sample_days = [
            (5, 10),
            (15, 18),
            (25, 3),
        ]

        for day, hour in sample_days:
            # Handle months with fewer days
            try:
                dt = datetime(year, month, day)
            except ValueError:
                dt = datetime(year, month, 1)  # fallback to 1st

            # Don't sample future dates
            if dt > now:
                continue

            date_str = dt.strftime("%Y-%m-%d")
            samples.append((date_str, hour))

    return samples

def main():
    print("=" * 70)
    print("  GH Archive Sampling: Claude Code Commit Tracker")
    print("=" * 70)
    print()

    samples = generate_sample_points()
    print(f"Sampling {len(samples)} hourly snapshots across the past ~13 months...")
    print()

    # Collect results grouped by month
    monthly_data = defaultdict(lambda: {
        "total_commits": 0,
        "claude_commits": 0,
        "hours_sampled": 0,
    })

    for i, (date_str, hour) in enumerate(samples):
        month_key = date_str[:7]  # YYYY-MM
        print(f"[{i+1}/{len(samples)}] Fetching {date_str} hour {hour:02d}:00 UTC ...", end=" ", flush=True)

        result = fetch_gharchive_hour(date_str, hour)

        if result is None:
            print("skipped")
            continue

        monthly_data[month_key]["total_commits"] += result["total_commits"]
        monthly_data[month_key]["claude_commits"] += result["claude_commits"]
        monthly_data[month_key]["hours_sampled"] += 1

        pct = (result["claude_commits"] / result["total_commits"] * 100) if result["total_commits"] > 0 else 0
        print(f"commits: {result['total_commits']:,} | claude: {result['claude_commits']:,} ({pct:.2f}%)")

        # Be polite to the server
        time.sleep(1)

    # --- Results ---
    print()
    print("=" * 70)
    print("  RESULTS: Estimated Daily Commits (extrapolated from hourly samples)")
    print("=" * 70)
    print()
    print(f"{'Month':<10} {'Sampled Hours':>14} {'Total/hr':>10} {'Claude/hr':>11} {'Est. Daily Total':>17} {'Est. Daily Claude':>18} {'Claude %':>10}")
    print("-" * 95)

    results_for_json = []

    for month in sorted(monthly_data.keys()):
        d = monthly_data[month]
        if d["hours_sampled"] == 0:
            continue

        avg_total_per_hour = d["total_commits"] / d["hours_sampled"]
        avg_claude_per_hour = d["claude_commits"] / d["hours_sampled"]

        est_daily_total = avg_total_per_hour * 24
        est_daily_claude = avg_claude_per_hour * 24

        pct = (avg_claude_per_hour / avg_total_per_hour * 100) if avg_total_per_hour > 0 else 0

        print(f"{month:<10} {d['hours_sampled']:>14} {avg_total_per_hour:>10,.0f} {avg_claude_per_hour:>11,.1f} {est_daily_total:>17,.0f} {est_daily_claude:>18,.0f} {pct:>9.2f}%")

        results_for_json.append({
            "month": month,
            "hours_sampled": d["hours_sampled"],
            "avg_commits_per_hour": round(avg_total_per_hour),
            "avg_claude_per_hour": round(avg_claude_per_hour, 1),
            "est_daily_total": round(est_daily_total),
            "est_daily_claude": round(est_daily_claude),
            "claude_percentage": round(pct, 3),
        })

    print()

    # Overall summary
    total_sampled_commits = sum(d["total_commits"] for d in monthly_data.values())
    total_claude_commits = sum(d["claude_commits"] for d in monthly_data.values())
    total_hours = sum(d["hours_sampled"] for d in monthly_data.values())

    if total_sampled_commits > 0:
        overall_pct = total_claude_commits / total_sampled_commits * 100
        print(f"Overall: sampled {total_hours} hours, {total_sampled_commits:,} commits, {total_claude_commits:,} Claude commits ({overall_pct:.2f}%)")

    # Save JSON results
    output_path = "scripts/gharchive_claude_stats.json"
    with open(output_path, "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_hours_sampled": total_hours,
            "total_commits_sampled": total_sampled_commits,
            "total_claude_commits_sampled": total_claude_commits,
            "overall_claude_percentage": round(overall_pct, 3) if total_sampled_commits > 0 else 0,
            "monthly": results_for_json,
        }, f, indent=2)
    print(f"\nDetailed results saved to {output_path}")

if __name__ == "__main__":
    main()
