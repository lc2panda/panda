#!/usr/bin/env bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name // empty')
ctx_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
perm=$(echo "$input" | jq -r '.permission_mode // empty')
branch=$(echo "$input" | jq -r '.git.branch // empty')
project=$(echo "$input" | jq -r '.workspace.project_dir // empty')
effort=$(echo "$input" | jq -r '.effort // empty')
five_pct=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
five_reset=$(echo "$input" | jq -r '.rate_limits.five_hour.resets_at // empty')
week_pct=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
week_reset=$(echo "$input" | jq -r '.rate_limits.seven_day.resets_at // empty')

Y='\033[33m'
G='\033[32m'
C='\033[36m'
M='\033[35m'
D='\033[2m'
B='\033[1m'
R='\033[0m'

bar() {
  local pct=${1:-0} total=10
  local filled=$(( ${pct%.*} * total / 100 ))
  [ $filled -gt $total ] && filled=$total
  local empty=$((total - filled))
  local out=""
  for ((i=0;i<filled;i++)); do out+="●"; done
  for ((i=0;i<empty;i++)); do out+="○"; done
  echo -n "$out"
}

line1=""
[ -n "$model" ] && line1+="${Y}${B}${model}${R}"
if [ -n "$ctx_pct" ]; then
  ctx_int=$(printf '%.0f' "$ctx_pct")
  line1+=" ${D}|${R} ✏️  ${G}${ctx_int}%${R}"
fi
proj=$(basename "${project:-$(pwd)}")
[ -n "$branch" ] && line1+=" ${D}|${R} ${C}${proj}${R} ${D}(${branch})${R}"
[ -n "$effort" ] && line1+=" ${D}|${R} ${M}● ${effort}${R}"
[ -n "$perm" ] && line1+=" ${D}|${R} ${D}${perm}${R}"

echo -e "$line1"

if [ -n "$five_pct" ]; then
  five_int=$(printf '%.0f' "$five_pct")
  reset_time=""
  [ -n "$five_reset" ] && reset_time=" ↻ $(date -r $(echo "$five_reset" | cut -c1-10) '+%l:%M%p' 2>/dev/null || echo "$five_reset")"
  echo -e "${D}current $(bar $five_int)  ${five_int}%${reset_time}${R}"
fi

if [ -n "$week_pct" ]; then
  week_int=$(printf '%.0f' "$week_pct")
  reset_time=""
  [ -n "$week_reset" ] && reset_time=" ↻ $(date -r $(echo "$week_reset" | cut -c1-10) '+%b %d, %l:%M%p' 2>/dev/null || echo "$week_reset")"
  echo -e "${D}weekly  $(bar $week_int)  ${week_int}%${reset_time}${R}"
fi
