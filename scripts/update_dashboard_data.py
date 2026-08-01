#!/usr/bin/env python3
"""
Incrementally fetch Claude commit signals from the GitHub Search API and
update the RAW_MONTHLY / RAW_WEEKLY arrays embedded in public/dashboard.html.

Only fetches periods that are missing or were previously stored as partial;
complete historical periods are never re-fetched. Run with --dry-run to see
what would be fetched without making any requests.

Requires GITHUB_TOKEN env var for authenticated rate limits (30 req/min).
"""

import argparse, calendar, json, os, re, sys, time, urllib.parse, urllib.request
from datetime import date, datetime, timedelta

API = "https://api.github.com/search/commits"
TOKEN = os.environ.get("GITHUB_TOKEN", "")
HEADERS = {
    "Accept": "application/vnd.github.cloak-preview+json",
    "User-Agent": "claude-tracker",
}
if TOKEN:
    HEADERS["Authorization"] = f"token {TOKEN}"

DELAY = 3 if TOKEN else 7  # seconds between queries
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DASHBOARD = os.path.join(SCRIPT_DIR, "..", "public", "dashboard.html")
DATA_JSON = os.path.join(SCRIPT_DIR, "data", "latest_signals.json")

# Query date ranges use GitHub's committer-date:A..B syntax, which is
# inclusive on both ends. Historical series were fetched with
# start..first-day-of-next-period (months: 1st..1st of next month; weeks:
# Monday..next Monday), so boundary days are double-counted across adjacent
# periods. This quirk is kept intentionally: total_count is approximate
# anyway, and changing the convention would break comparability with the
# 15+ months of stored history.


def count(q, retries=5):
    url = f"{API}?q={urllib.parse.quote(q, safe=':+')}&per_page=1"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read())
                return data.get("total_count", 0)
        except Exception as e:
            if attempt < retries - 1:
                wait = 10 * (2 ** attempt)  # 10, 20, 40, 80s
                retry_after = getattr(e, "headers", None)
                if retry_after:
                    ra = retry_after.get("Retry-After")
                    if ra and ra.isdigit():
                        wait = max(wait, int(ra))
                print(f"  Retry in {wait}s: {e}", file=sys.stderr)
                time.sleep(wait)
            else:
                print(f"  FAILED: {q[:60]}... → {e}", file=sys.stderr)
                return None
    return None


def fetch_signals(rng, label):
    """Fetch all 6 signals for a committer-date range. None on any failure."""
    print(f"\n--- {label} ({rng}) ---", file=sys.stderr)
    queries = [
        ("url", f"claude.ai/code committer-date:{rng}"),
        ("author", f"author-name:Claude committer-date:{rng}"),
        ("coauthor", f'"Co-authored-by: Claude" committer-date:{rng}'),
        ("ab", f"claude.ai/code author-name:Claude committer-date:{rng}"),
        ("ac", f'claude.ai/code "Co-authored-by: Claude" committer-date:{rng}'),
        ("total", f"committer-date:{rng}"),
    ]
    out = {}
    for key, q in queries:
        out[key] = count(q)
        print(f"  {key}: {out[key]}", file=sys.stderr)
        time.sleep(DELAY)
    if any(v is None for v in out.values()):
        return None
    return out


# ---------------- parse existing data out of dashboard.html ----------------

MONTH_ROW = re.compile(
    r'\{m:"(?P<m>[\d-]+)",url:(?P<url>\d+),author:(?P<author>\d+),'
    r"coauthor:(?P<coauthor>\d+),ab:(?P<ab>\d+),ac:(?P<ac>\d+),"
    r"total:(?P<total>\d+),days:(?P<days>\d+)\}"
)
WEEK_ROW = re.compile(
    r'\{w:"(?P<w>[\dW-]+)",s:"(?P<s>[\d-]+)",e:"(?P<e>[\d-]+)",'
    r"url:(?P<url>\d+),author:(?P<author>\d+),coauthor:(?P<coauthor>\d+),"
    r"ab:(?P<ab>\d+),ac:(?P<ac>\d+),total:(?P<total>\d+),days:(?P<days>\d+)\}"
)
NUM_FIELDS = ("url", "author", "coauthor", "ab", "ac", "total", "days")


def parse_existing(html):
    def block(name):
        m = re.search(rf"const {name} = \[.*?\];", html, re.DOTALL)
        if not m:
            print(f"ERROR: {name} array not found in dashboard.html", file=sys.stderr)
            sys.exit(1)
        return m.group(0)

    monthly = []
    for m in MONTH_ROW.finditer(block("RAW_MONTHLY")):
        row = m.groupdict()
        monthly.append({"m": row["m"], **{k: int(row[k]) for k in NUM_FIELDS}})
    weekly = []
    for m in WEEK_ROW.finditer(block("RAW_WEEKLY")):
        row = m.groupdict()
        weekly.append({"w": row["w"], "s": row["s"], "e": row["e"],
                       **{k: int(row[k]) for k in NUM_FIELDS}})
    if not monthly or not weekly:
        print("ERROR: failed to parse existing data rows", file=sys.stderr)
        sys.exit(1)
    return monthly, weekly


# ---------------- decide which periods need fetching ----------------

def plan_months(existing, today):
    """Months from 2025-01 that are missing or were stored as partial."""
    have = {r["m"]: r for r in existing}
    todo = []
    y, mo = 2025, 1
    while (y, mo) <= (today.year, today.month):
        label = f"{y}-{mo:02d}"
        dim = calendar.monthrange(y, mo)[1]
        is_current = (y, mo) == (today.year, today.month)
        if is_current:
            complete_days = (today - date(y, mo, 1)).days
            if complete_days >= 7 and have.get(label, {}).get("days", -1) != complete_days:
                end = today  # covers complete days 1..(today-1)
                todo.append({"m": label, "days": complete_days,
                             "rng": f"{label}-01..{end:%Y-%m-%d}"})
        elif have.get(label, {}).get("days", -1) < dim:
            nxt = date(y, mo, 1) + timedelta(days=dim)
            todo.append({"m": label, "days": dim,
                         "rng": f"{label}-01..{nxt:%Y-%m-%d}"})
        y, mo = (y + 1, 1) if mo == 12 else (y, mo + 1)
    return todo


def plan_weeks(existing, today):
    """Complete ISO weeks since 2025-W01 not yet stored."""
    have = {r["w"] for r in existing}
    todo = []
    iy, iw = 2025, 1
    while True:
        try:
            mon = date.fromisocalendar(iy, iw, 1)
        except ValueError:
            iy, iw = iy + 1, 1
            continue
        sun = mon + timedelta(days=6)
        if sun > today - timedelta(days=1):
            break  # week not complete yet
        label = f"{iy}-W{iw:02d}"
        if label not in have:
            # e stores the Sunday (display); query runs to next Monday to
            # match the double-inclusive boundary convention (see above).
            todo.append({"w": label, "s": f"{mon:%Y-%m-%d}", "e": f"{sun:%Y-%m-%d}",
                         "days": 7, "rng": f"{mon:%Y-%m-%d}..{sun + timedelta(days=1):%Y-%m-%d}"})
        iw += 1
    return todo


# ---------------- serialize & write ----------------

def month_js(r):
    return (f'  {{m:"{r["m"]}",url:{r["url"]},author:{r["author"]},'
            f'coauthor:{r["coauthor"]},ab:{r["ab"]},ac:{r["ac"]},'
            f'total:{r["total"]},days:{r["days"]}}},')


def week_js(r):
    return (f'  {{w:"{r["w"]}",s:"{r["s"]}",e:"{r["e"]}",'
            f'url:{r["url"]},author:{r["author"]},coauthor:{r["coauthor"]},'
            f'ab:{r["ab"]},ac:{r["ac"]},total:{r["total"]},days:{r["days"]}}},')


def write_outputs(monthly, weekly):
    with open(DASHBOARD) as f:
        html = f.read()
    blocks = {
        "RAW_MONTHLY": "\n".join(month_js(r) for r in monthly),
        "RAW_WEEKLY": "\n".join(week_js(r) for r in weekly),
    }
    for name, body in blocks.items():
        new = f"const {name} = [\n{body}\n];"
        html, n = re.subn(rf"const {name} = \[.*?\];", lambda _: new, html,
                          count=1, flags=re.DOTALL)
        if n != 1:
            print(f"ERROR: could not replace {name} block", file=sys.stderr)
            sys.exit(1)
    with open(DASHBOARD, "w") as f:
        f.write(html)
    print(f"\nDashboard updated: {DASHBOARD}", file=sys.stderr)

    os.makedirs(os.path.dirname(DATA_JSON), exist_ok=True)
    with open(DATA_JSON, "w") as f:
        json.dump({"updated_at": datetime.utcnow().isoformat() + "Z",
                   "monthly": monthly, "weekly": weekly}, f, indent=2)
    print(f"Data also saved to {DATA_JSON}", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true",
                    help="list periods that would be fetched, then exit")
    args = ap.parse_args()

    today = datetime.utcnow().date()
    with open(DASHBOARD) as f:
        monthly, weekly = parse_existing(f.read())

    m_todo = plan_months(monthly, today)
    w_todo = plan_weeks(weekly, today)
    print(f"Months to fetch: {[t['m'] for t in m_todo] or 'none'}", file=sys.stderr)
    print(f"Weeks to fetch:  {[t['w'] for t in w_todo] or 'none'}", file=sys.stderr)
    if args.dry_run:
        return
    if not m_todo and not w_todo:
        print("Everything up to date.", file=sys.stderr)
        return

    by_month = {r["m"]: r for r in monthly}
    for t in m_todo:
        data = fetch_signals(t["rng"], t["m"])
        if data is None:
            print(f"ERROR: fetch failed for {t['m']}; nothing written", file=sys.stderr)
            sys.exit(1)
        by_month[t["m"]] = {"m": t["m"], **data, "days": t["days"]}
    monthly = [by_month[k] for k in sorted(by_month)]

    for t in w_todo:
        data = fetch_signals(t["rng"], t["w"])
        if data is None:
            print(f"ERROR: fetch failed for {t['w']}; nothing written", file=sys.stderr)
            sys.exit(1)
        weekly.append({"w": t["w"], "s": t["s"], "e": t["e"], **data, "days": t["days"]})
    weekly.sort(key=lambda r: r["w"])

    write_outputs(monthly, weekly)


if __name__ == "__main__":
    main()
