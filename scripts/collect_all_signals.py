#!/usr/bin/env python3
"""Collect all 3 Claude commit signals + overlaps + totals by month."""

import json, time, urllib.parse, urllib.request, sys

API = "https://api.github.com/search/commits"
HEADERS = {"Accept": "application/vnd.github.cloak-preview+json", "User-Agent": "claude-tracker"}

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
                time.sleep(10)
            else:
                print(f"  FAILED: {q[:60]}... → {e}", file=sys.stderr)
                return 0

# Define months to query
months = [
    ("2025-01-01", "2025-02-01"),
    ("2025-02-01", "2025-03-01"),
    ("2025-03-01", "2025-04-01"),
    ("2025-04-01", "2025-05-01"),
    ("2025-05-01", "2025-06-01"),
    ("2025-06-01", "2025-07-01"),
    ("2025-07-01", "2025-08-01"),
    ("2025-08-01", "2025-09-01"),
    ("2025-09-01", "2025-10-01"),
    ("2025-10-01", "2025-11-01"),
    ("2025-11-01", "2025-12-01"),
    ("2025-12-01", "2026-01-01"),
    ("2026-01-01", "2026-02-01"),
    ("2026-02-01", "2026-02-17"),
]

DELAY = 6.5  # seconds between queries to respect rate limits

results = []
for start, end in months:
    rng = f"{start}..{end}"
    label = start[:7]
    print(f"\n--- {label} ---", file=sys.stderr)
    
    row = {"month": label, "start": start, "end": end}
    
    # Signal A: URL in commit message
    row["url"] = count(f"claude.ai/code committer-date:{rng}")
    print(f"  URL: {row['url']:,}", file=sys.stderr)
    time.sleep(DELAY)
    
    # Signal B: author-name:Claude
    row["author"] = count(f"author-name:Claude committer-date:{rng}")
    print(f"  Author: {row['author']:,}", file=sys.stderr)
    time.sleep(DELAY)
    
    # Signal C: Co-authored-by trailer (broad)
    row["coauthor"] = count(f'"Co-authored-by: Claude" committer-date:{rng}')
    print(f"  CoAuthor: {row['coauthor']:,}", file=sys.stderr)
    time.sleep(DELAY)
    
    # Overlap A∩B
    row["url_and_author"] = count(f"claude.ai/code author-name:Claude committer-date:{rng}")
    print(f"  URL∩Auth: {row['url_and_author']:,}", file=sys.stderr)
    time.sleep(DELAY)
    
    # Overlap A∩C
    row["url_and_coauthor"] = count(f'claude.ai/code "Co-authored-by: Claude" committer-date:{rng}')
    print(f"  URL∩CoAuth: {row['url_and_coauthor']:,}", file=sys.stderr)
    time.sleep(DELAY)
    
    # Total commits (use empty query with date range, count all)
    row["total"] = count(f"committer-date:{rng}")
    print(f"  Total: {row['total']:,}", file=sys.stderr)
    time.sleep(DELAY)
    
    results.append(row)
    print(f"  Done: union est = {row['url'] + row['author'] + row['coauthor'] - row['url_and_author'] - row['url_and_coauthor']:,}", file=sys.stderr)

# Save results
with open("/home/user/ASpaceOdyssey/scripts/data/all_signals.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nSaved to scripts/data/all_signals.json", file=sys.stderr)
