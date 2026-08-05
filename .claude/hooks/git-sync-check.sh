#!/usr/bin/env bash
# SessionStart hook: sync local main with origin, or report a discrepancy.
git fetch --quiet >/dev/null 2>&1
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -z "$branch" ] || [ "$branch" = "HEAD" ]; then exit 0; fi
upstream=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null)
if [ -z "$upstream" ]; then exit 0; fi
set -- $(git rev-list --left-right --count "$upstream...HEAD" 2>/dev/null)
behind=$1; ahead=$2
if [ -z "$behind" ] || [ "$behind" = "0" ]; then exit 0; fi
if [ "$ahead" != "0" ]; then
  msg="Git: branch '$branch' has DIVERGED from $upstream ($ahead ahead, $behind behind). Do NOT auto-pull -- report this discrepancy to the user at the start of the session."
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}' "$msg"
  exit 0
fi
if [ -n "$(git status --porcelain)" ]; then
  msg="Git: branch '$branch' is $behind commit(s) behind $upstream, but there are uncommitted local changes so it was NOT auto-pulled. Report this to the user at the start of the session."
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}' "$msg"
  exit 0
fi
git pull --ff-only --quiet >/dev/null 2>&1
msg="Git: branch '$branch' was $behind commit(s) behind $upstream and has been auto-pulled (fast-forwarded) at session start."
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}' "$msg"
