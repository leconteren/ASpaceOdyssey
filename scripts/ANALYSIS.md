# Claude Code GitHub Commit Share — Analysis

## Methodology

We queried the **GitHub Search API** (`/search/commits`) to count Claude Code
commits using 3 detection signals, then compared with total public commit counts.

### Detection Signals

| Signal | What it catches | Query |
|--------|----------------|-------|
| **A — URL** | `claude.ai/code/` link in commit message | `claude.ai/code committer-date:RANGE` |
| **B — Author** | Claude as git author (Claude Code on web) | `author-name:Claude committer-date:RANGE` |
| **C — Co-Author** | `Co-authored-by: Claude ...` trailer (CLI usage) | `"Co-authored-by: Claude" committer-date:RANGE` |

### Key Finding: Signal C dominates

The **Co-authored-by trailer** is by far the biggest signal (~260k/day in late Jan 2026),
dwarfing the URL (~33k) and author (~38k) signals. Our initial analysis missed it
because the trailer format includes the model name:

```
Co-authored-by: Claude Opus 4.5 <noreply@anthropic.com>
```

...not the simpler `Claude <noreply@anthropic.com>` we searched for initially.

## Single-Day Breakdown (Jan 28, 2026)

```
Signal A — claude.ai/code URL:              33,111
Signal B — author-name:Claude:              37,590
Signal C — Co-authored-by: Claude trailer: 260,493

Overlap A∩B:  26,980
Overlap A∩C:   2,482
Overlap B∩C:      ~0  (if Claude IS the author, no co-author trailer needed)

Union estimate (A ∪ B ∪ C):               ~301,732
```

## Growth Trend (daily estimates from multi-signal union)

| Date | URL/day | Author/day | CoAuthor/day | Union Est/day |
|------|---------|------------|--------------|---------------|
| Jun 15 2025 | 19,593 | 2,220 | 20,377 | ~22,455 |
| Aug 15 2025 | 36,260 | 2,910 | 39,020 | ~41,974 |
| Nov 15 2025 | 7,015 | 79,474 | 75,768 | ~159,991 |
| Jan 28 2026 | 33,111 | 37,590 | 260,493 | ~301,732 |
| Feb 5 2026 | 44,223 | 52,152 | (not queried) | ~70k+ |
| Feb 10 2026 | 48,467 | 48,535 | (not queried) | ~66k+ |

## Comparison with SemiAnalysis

SemiAnalysis reports **~134k Claude commits/day = 4% of public commits** (Feb 2026).

Our data shows:

- **Conservative (URL + Author only)**: ~60-70k/day → ~1.3% of 5.1M daily commits
- **With Co-Author trailer**: ~300k/day → ~5.9% of 5.1M daily commits
- **SemiAnalysis figure**: ~134k/day → 4% (using ~3.35M daily commits denominator)

### Why the discrepancies?

1. **Denominator difference**: We measure ~5.1M commits/day; SemiAnalysis uses ~3.35M.
   They likely count unique pushes or filter differently.

2. **GitHub Search API total_count is approximate** — documented to over/under-count
   for large result sets. Different query granularities yield different totals.

3. **SemiAnalysis uses GH Archive raw data** (BigQuery), which has exact commit message
   text. This allows precise regex matching and deduplication by SHA.

4. **The Co-authored-by signal may include some noise** — humans named Claude,
   or the API over-approximating.

## Conclusion

The true Claude Code contribution is likely in the range of **2-5% of all public
GitHub commits** as of Feb 2026, growing rapidly. The exact figure depends on:
- How you count "commits" (per-push vs per-SHA vs per-event)
- Whether you include commits where users disabled attribution
- The total commit denominator used

SemiAnalysis's 4% figure from GH Archive/BigQuery analysis is the most rigorous
estimate available.
