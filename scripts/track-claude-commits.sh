#!/usr/bin/env bash
#
# track-claude-commits.sh
# Track how many git commits were contributed by Claude Code.
#
# Claude Code appends "https://claude.ai/code/session_..." to commit messages.
# This script uses that signature to identify and report Claude Code contributions.
#
# Usage:
#   ./scripts/track-claude-commits.sh [options]
#
# Options:
#   -r, --repo PATH       Path to git repo (default: current directory)
#   -b, --branch BRANCH   Branch to analyze (default: all branches)
#   -s, --since DATE      Only commits after this date (e.g. 2025-01-01)
#   -u, --until DATE      Only commits before this date
#   -a, --author AUTHOR   Filter by author name/email
#   --json                Output as JSON
#   -h, --help            Show help

set -euo pipefail

# --- Defaults ---
REPO_PATH="."
BRANCH=""
SINCE=""
UNTIL=""
AUTHOR=""
JSON_OUTPUT=false
CLAUDE_SIGNATURE="claude\.ai/code/"

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case $1 in
    -r|--repo)    REPO_PATH="$2"; shift 2 ;;
    -b|--branch)  BRANCH="$2"; shift 2 ;;
    -s|--since)   SINCE="$2"; shift 2 ;;
    -u|--until)   UNTIL="$2"; shift 2 ;;
    -a|--author)  AUTHOR="$2"; shift 2 ;;
    --json)       JSON_OUTPUT=true; shift ;;
    -h|--help)
      sed -n '2,/^$/s/^# \?//p' "$0"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# --- Build git log arguments ---
GIT_ARGS=(-C "$REPO_PATH" log --format="%H%x09%ai%x09%an%x09%ae%x09%s")

if [[ -n "$BRANCH" ]]; then
  GIT_ARGS+=("$BRANCH")
else
  GIT_ARGS+=(--all)
fi

[[ -n "$SINCE" ]]  && GIT_ARGS+=(--since="$SINCE")
[[ -n "$UNTIL" ]]  && GIT_ARGS+=(--until="$UNTIL")
[[ -n "$AUTHOR" ]] && GIT_ARGS+=(--author="$AUTHOR")

# --- Collect data ---
TOTAL_COMMITS=0
CLAUDE_COMMITS=0

declare -A AUTHOR_TOTAL
declare -A AUTHOR_CLAUDE
declare -A MONTHLY_TOTAL
declare -A MONTHLY_CLAUDE

while IFS=$'\t' read -r hash date author email subject; do
  [[ -z "$hash" ]] && continue
  TOTAL_COMMITS=$((TOTAL_COMMITS + 1))

  month="${date:0:7}"  # YYYY-MM
  MONTHLY_TOTAL["$month"]=$(( ${MONTHLY_TOTAL["$month"]:-0} + 1 ))
  AUTHOR_TOTAL["$author <$email>"]=$(( ${AUTHOR_TOTAL["$author <$email>"]:-0} + 1 ))

  # Check full commit message for Claude Code signature
  full_msg=$(git -C "$REPO_PATH" log -1 --format="%B" "$hash")
  if echo "$full_msg" | grep -qE "$CLAUDE_SIGNATURE"; then
    CLAUDE_COMMITS=$((CLAUDE_COMMITS + 1))
    MONTHLY_CLAUDE["$month"]=$(( ${MONTHLY_CLAUDE["$month"]:-0} + 1 ))
    AUTHOR_CLAUDE["$author <$email>"]=$(( ${AUTHOR_CLAUDE["$author <$email>"]:-0} + 1 ))
  fi
done < <(git "${GIT_ARGS[@]}" 2>/dev/null)

HUMAN_COMMITS=$((TOTAL_COMMITS - CLAUDE_COMMITS))

if [[ "$TOTAL_COMMITS" -eq 0 ]]; then
  if $JSON_OUTPUT; then
    echo '{"total_commits":0,"claude_commits":0,"human_commits":0,"claude_percentage":0}'
  else
    echo "No commits found."
  fi
  exit 0
fi

CLAUDE_PCT=$(awk "BEGIN {printf \"%.1f\", ($CLAUDE_COMMITS/$TOTAL_COMMITS)*100}")

# --- JSON output ---
if $JSON_OUTPUT; then
  echo "{"
  echo "  \"total_commits\": $TOTAL_COMMITS,"
  echo "  \"claude_commits\": $CLAUDE_COMMITS,"
  echo "  \"human_commits\": $HUMAN_COMMITS,"
  echo "  \"claude_percentage\": $CLAUDE_PCT,"
  echo "  \"by_author\": {"

  first=true
  for author in "${!AUTHOR_TOTAL[@]}"; do
    $first || echo ","
    first=false
    a_total=${AUTHOR_TOTAL["$author"]}
    a_claude=${AUTHOR_CLAUDE["$author"]:-0}
    # Escape quotes in author name
    escaped=$(echo "$author" | sed 's/"/\\"/g')
    printf "    \"%s\": {\"total\": %d, \"claude\": %d}" "$escaped" "$a_total" "$a_claude"
  done

  echo ""
  echo "  },"
  echo "  \"by_month\": {"

  first=true
  for month in $(echo "${!MONTHLY_TOTAL[@]}" | tr ' ' '\n' | sort); do
    $first || echo ","
    first=false
    m_total=${MONTHLY_TOTAL["$month"]}
    m_claude=${MONTHLY_CLAUDE["$month"]:-0}
    printf "    \"%s\": {\"total\": %d, \"claude\": %d}" "$month" "$m_total" "$m_claude"
  done

  echo ""
  echo "  }"
  echo "}"
  exit 0
fi

# --- Human-readable output ---
echo "╔══════════════════════════════════════════════════╗"
echo "║         Claude Code Commit Tracker               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "Repository: $(cd "$REPO_PATH" && git remote get-url origin 2>/dev/null || echo "$REPO_PATH")"
[[ -n "$BRANCH" ]] && echo "Branch:     $BRANCH" || echo "Branch:     (all)"
[[ -n "$SINCE" ]]  && echo "Since:      $SINCE"
[[ -n "$UNTIL" ]]  && echo "Until:      $UNTIL"
echo ""
echo "── Summary ──────────────────────────────────────"
printf "  Total commits:        %d\n" "$TOTAL_COMMITS"
printf "  Claude Code commits:  %d  (%s%%)\n" "$CLAUDE_COMMITS" "$CLAUDE_PCT"
printf "  Human commits:        %d  (%s%%)\n" "$HUMAN_COMMITS" "$(awk "BEGIN {printf \"%.1f\", ($HUMAN_COMMITS/$TOTAL_COMMITS)*100}")"
echo ""

# Progress bar
BAR_WIDTH=40
filled=$((CLAUDE_COMMITS * BAR_WIDTH / TOTAL_COMMITS))
empty=$((BAR_WIDTH - filled))
printf "  [%s%s] %s%% Claude Code\n" \
  "$(printf '█%.0s' $(seq 1 $filled 2>/dev/null) 2>/dev/null)" \
  "$(printf '░%.0s' $(seq 1 $empty 2>/dev/null) 2>/dev/null)" \
  "$CLAUDE_PCT"
echo ""

# By author breakdown
echo "── By Author ────────────────────────────────────"
for author in "${!AUTHOR_TOTAL[@]}"; do
  a_total=${AUTHOR_TOTAL["$author"]}
  a_claude=${AUTHOR_CLAUDE["$author"]:-0}
  a_human=$((a_total - a_claude))
  printf "  %-40s total: %3d | claude: %3d | human: %3d\n" "$author" "$a_total" "$a_claude" "$a_human"
done
echo ""

# By month breakdown
echo "── By Month ─────────────────────────────────────"
for month in $(echo "${!MONTHLY_TOTAL[@]}" | tr ' ' '\n' | sort); do
  m_total=${MONTHLY_TOTAL["$month"]}
  m_claude=${MONTHLY_CLAUDE["$month"]:-0}
  m_human=$((m_total - m_claude))
  m_pct=$(awk "BEGIN {printf \"%.0f\", ($m_claude/$m_total)*100}")
  printf "  %s   total: %3d | claude: %3d (%2s%%) | human: %3d\n" "$month" "$m_total" "$m_claude" "$m_pct" "$m_human"
done
echo ""
