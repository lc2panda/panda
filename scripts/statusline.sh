#!/usr/bin/env bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name // empty')
ctx=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
perm=$(echo "$input" | jq -r '.permission_mode // empty')
branch=$(echo "$input" | jq -r '.git.branch // empty')
five=$(echo "$input" | jq -r '.rate_limits.five_hour.used_percentage // empty')
week=$(echo "$input" | jq -r '.rate_limits.seven_day.used_percentage // empty')
out=""
[ -n "$model" ] && out="$model"
[ -n "$ctx" ] && out="$out | ctx:$(printf '%.0f' "$ctx")%"
[ -n "$branch" ] && out="$out | $branch"
[ -n "$perm" ] && out="$out | $perm"
[ -n "$five" ] && out="$out | 5h:$(printf '%.0f' "$five")%"
[ -n "$week" ] && out="$out | 7d:$(printf '%.0f' "$week")%"
echo "$out"
