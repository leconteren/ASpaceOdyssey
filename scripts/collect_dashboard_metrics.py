#!/usr/bin/env python3
"""
Collect dashboard metrics from public APIs.
Updates dashboardData.ts with fresh data for metrics that have public APIs.

Supported data sources:
  - GitHub Search API: Claude commit signals (reuses existing all_signals.json)
  - FRED API: SW dev job postings (IHLIDXUSTPSOFTDEVE), UI claims (ICSA)

Usage:
  python3 scripts/collect_dashboard_metrics.py [--fred-key YOUR_FRED_API_KEY]
"""

import json
import sys
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
ROOT_DIR = SCRIPT_DIR.parent

FRED_API_BASE = "https://api.stlouisfed.org/fred/series/observations"
FRED_SERIES = {
    "job_postings": "IHLIDXUSTPSOFTDEVE",  # Indeed SW dev job postings
    "ui_claims": "ICSA",                    # Initial unemployment claims
}


def fetch_fred_series(series_id: str, api_key: str, start_date: str = "2024-01-01") -> list[dict]:
    """Fetch a FRED series and return monthly observations."""
    url = (
        f"{FRED_API_BASE}?series_id={series_id}"
        f"&api_key={api_key}&file_type=json"
        f"&observation_start={start_date}"
        f"&frequency=m"  # monthly
    )
    req = Request(url, headers={"User-Agent": "dashboard-metrics-collector"})

    for attempt in range(3):
        try:
            with urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                return [
                    {
                        "date": obs["date"][:7],  # YYYY-MM
                        "value": float(obs["value"]) if obs["value"] != "." else None,
                    }
                    for obs in data.get("observations", [])
                    if obs["value"] != "."
                ]
        except HTTPError as e:
            print(f"  FRED API error (attempt {attempt + 1}): {e}")
            time.sleep(5 * (attempt + 1))

    return []


def load_github_signals() -> list[dict]:
    """Load GitHub commit signals from existing all_signals.json."""
    path = DATA_DIR / "all_signals.json"
    if not path.exists():
        print(f"  Warning: {path} not found")
        return []

    with open(path) as f:
        raw = json.loads(f.read())

    results = []
    for entry in raw:
        # union = url + author + coauthor - ab - ac
        url = entry.get("url", 0)
        author = entry.get("author", 0)
        coauthor = entry.get("coauthor", 0)
        ab = entry.get("url_and_author", 0)
        ac = entry.get("url_and_coauthor", 0)
        union = url + author + coauthor - ab - ac
        results.append({
            "date": entry["month"],
            "value": union,
        })

    return results


def update_typescript_data(metric_id: str, data: list[dict]):
    """Update the corresponding array in dashboardData.ts."""
    ts_path = ROOT_DIR / "dashboardData.ts"
    if not ts_path.exists():
        print(f"  Warning: {ts_path} not found")
        return

    content = ts_path.read_text()

    # Map metric_id to TypeScript variable name
    var_names = {
        "github_commits": "GITHUB_COMMITS_DATA",
        "job_postings": "JOB_POSTINGS_DATA",
        "ui_claims": "UI_CLAIMS_DATA",
    }

    var_name = var_names.get(metric_id)
    if not var_name:
        return

    # Format data as TypeScript array entries
    entries = []
    for d in data:
        if d.get("value") is not None:
            val = d["value"]
            # Format: integer for large numbers, decimal for small
            val_str = str(int(val)) if val > 100 else str(round(val, 1))
            entries.append(f"  {{ date: '{d['date']}', value: {val_str} }},")

    new_array = "[\n" + "\n".join(entries) + "\n]"

    # Replace the existing array using regex
    pattern = rf"(export const {var_name}: MetricDataPoint\[\] = )\[[\s\S]*?\];"
    replacement = rf"\g<1>{new_array};"

    new_content = re.sub(pattern, replacement, content)
    if new_content != content:
        ts_path.write_text(new_content)
        print(f"  Updated {var_name} with {len(data)} entries")
    else:
        print(f"  No changes to {var_name}")


def main():
    fred_key = None

    # Parse args
    args = sys.argv[1:]
    for i, arg in enumerate(args):
        if arg == "--fred-key" and i + 1 < len(args):
            fred_key = args[i + 1]

    # Try env var
    if not fred_key:
        fred_key = os.environ.get("FRED_API_KEY")

    print("=== Dashboard Metrics Collector ===\n")

    # 1. GitHub commits (from existing data)
    print("[1/3] GitHub Commits (from all_signals.json)...")
    github_data = load_github_signals()
    if github_data:
        update_typescript_data("github_commits", github_data)
        print(f"  Loaded {len(github_data)} months of GitHub commit data")
    else:
        print("  Skipped (no data)")

    # 2. FRED: Job postings
    if fred_key:
        print("\n[2/3] SW Dev Job Postings (FRED)...")
        job_data = fetch_fred_series(FRED_SERIES["job_postings"], fred_key)
        if job_data:
            update_typescript_data("job_postings", job_data)
        else:
            print("  No data returned (series may be discontinued)")

        # 3. FRED: UI Claims
        print("\n[3/3] Initial Unemployment Claims (FRED)...")
        claims_data = fetch_fred_series(FRED_SERIES["ui_claims"], fred_key)
        if claims_data:
            # Convert to thousands
            for d in claims_data:
                if d["value"] is not None:
                    d["value"] = round(d["value"] / 1000, 0)
            update_typescript_data("ui_claims", claims_data)
        else:
            print("  No data returned")
    else:
        print("\n[2/3] SW Dev Job Postings: Skipped (no FRED API key)")
        print("[3/3] UI Claims: Skipped (no FRED API key)")
        print("\n  To fetch FRED data, provide --fred-key YOUR_KEY or set FRED_API_KEY env var")
        print("  Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html")

    print("\n=== Done ===")


if __name__ == "__main__":
    main()
