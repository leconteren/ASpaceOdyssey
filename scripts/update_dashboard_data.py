#!/usr/bin/env python3
"""
Fetch latest Claude commit signals from GitHub Search API and update
the dashboard HTML with fresh data. Designed to run in CI on a schedule.

Requires GITHUB_TOKEN env var for authenticated rate limits (30 req/min).
"""

import json, os, re, sys, time, urllib.parse, urllib.request
from datetime import datetime, timedelta

API = "https://api.github.com/search/commits"
TOKEN = os.environ.get("GITHUB_TOKEN", "")
HEADERS = {
    "Accept": "application/vnd.github.cloak-preview+json",
    "User-Agent": "claude-tracker",
}
if TOKEN:
    HEADERS["Authorization"] = f"token {TOKEN}"

DELAY = 3 if TOKEN else 7  # seconds between queries
DASHBOARD = os.path.join(os.path.dirname(__file__), "..", "public", "dashboard.html")


def count(q, retries=3):
    url = f"{API}?q={urllib.parse.quote(q, safe=':+')}&per_page=1"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read())
                return data.get("total_count", 0)
        except Exception as e:
            if attempt < retries - 1:
                wait = 10 * (attempt + 1)
                print(f"  Retry in {wait}s: {e}", file=sys.stderr)
                time.sleep(wait)
            else:
                print(f"  FAILED: {q[:60]}... → {e}", file=sys.stderr)
                return None
    return None


def generate_months():
    """Generate (start, end) date pairs from 2025-01 to current month."""
    now = datetime.utcnow()
    current_day = now.day
    start = datetime(2025, 1, 1)
    months = []
    while start < now:
        y, m = start.year, start.month
        if m == 12:
            end = datetime(y + 1, 1, 1)
        else:
            end = datetime(y, m + 1, 1)
        # For current month, end at today
        if end > now:
            end = now
            days = current_day
        else:
            days = (end - start).days
        months.append({
            "start": start.strftime("%Y-%m-%d"),
            "end": end.strftime("%Y-%m-%d"),
            "label": start.strftime("%Y-%m"),
            "days": days,
        })
        start = end
    return months


def fetch_month_data(rng, label):
    """Fetch all 6 signals for a given month range."""
    print(f"\n--- {label} ---", file=sys.stderr)

    url_count = count(f"claude.ai/code committer-date:{rng}")
    print(f"  URL: {url_count}", file=sys.stderr)
    time.sleep(DELAY)

    author_count = count(f"author-name:Claude committer-date:{rng}")
    print(f"  Author: {author_count}", file=sys.stderr)
    time.sleep(DELAY)

    coauthor_count = count(f'"Co-authored-by: Claude" committer-date:{rng}')
    print(f"  CoAuthor: {coauthor_count}", file=sys.stderr)
    time.sleep(DELAY)

    ab = count(f"claude.ai/code author-name:Claude committer-date:{rng}")
    print(f"  URL∩Auth: {ab}", file=sys.stderr)
    time.sleep(DELAY)

    ac = count(f'claude.ai/code "Co-authored-by: Claude" committer-date:{rng}')
    print(f"  URL∩CoAuth: {ac}", file=sys.stderr)
    time.sleep(DELAY)

    total = count(f"committer-date:{rng}")
    print(f"  Total: {total}", file=sys.stderr)
    time.sleep(DELAY)

    # Check for any failures
    values = [url_count, author_count, coauthor_count, ab, ac, total]
    if any(v is None for v in values):
        return None

    return {
        "url": url_count,
        "author": author_count,
        "coauthor": coauthor_count,
        "ab": ab,
        "ac": ac,
        "total": total,
    }


def build_raw_js(rows):
    """Build the RAW JavaScript array string."""
    lines = []
    for r in rows:
        lines.append(
            f'  {{m:"{r["m"]}",url:{r["url"]},author:{r["author"]},'
            f'coauthor:{r["coauthor"]},ab:{r["ab"]},ac:{r["ac"]},'
            f'total:{r["total"]},days:{r["days"]}}},'
        )
    return "const RAW_MONTHLY = [\n" + "\n".join(lines) + "\n];"


def update_dashboard(new_raw_js):
    """Replace the RAW array in dashboard.html."""
    with open(DASHBOARD, "r") as f:
        html = f.read()

    # Match the RAW = [...]; block
    pattern = r"const RAW_MONTHLY = \[.*?\];"
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        print("ERROR: Could not find RAW_MONTHLY array in dashboard.html", file=sys.stderr)
        sys.exit(1)

    html = html[:match.start()] + new_raw_js + html[match.end():]

    # Update the subtitle date range
    now = datetime.utcnow()
    date_pattern = r"Jan 2025 – \w+ \d{4}"
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    new_range = f"Jan 2025 – {month_names[now.month - 1]} {now.year}"
    html = re.sub(date_pattern, new_range, html)

    # Update the partial month note
    partial_pattern = r"Mar 2026 partial \(1st–\d+\w*\)"
    new_partial = f"{month_names[now.month - 1]} {now.year} partial (1st–{now.day}th)"
    html = re.sub(partial_pattern, new_partial, html)

    with open(DASHBOARD, "w") as f:
        f.write(html)

    print(f"\nDashboard updated: {DASHBOARD}", file=sys.stderr)


def main():
    months = generate_months()
    rows = []

    for month_info in months:
        rng = f"{month_info['start']}..{month_info['end']}"
        data = fetch_month_data(rng, month_info["label"])
        if data is None:
            print(f"ERROR: Failed to fetch data for {month_info['label']}", file=sys.stderr)
            sys.exit(1)

        rows.append({
            "m": month_info["label"],
            "days": month_info["days"],
            **data,
        })

    raw_js = build_raw_js(rows)
    update_dashboard(raw_js)

    # Also save raw JSON for reference
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(data_dir, exist_ok=True)
    with open(os.path.join(data_dir, "latest_signals.json"), "w") as f:
        json.dump(rows, f, indent=2)
    print("Data also saved to scripts/data/latest_signals.json", file=sys.stderr)


if __name__ == "__main__":
    main()
