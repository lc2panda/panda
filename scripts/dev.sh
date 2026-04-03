#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
# NOTE: Do NOT set USER_TYPE=ant — it activates Anthropic infrastructure
# paths (bridge, advisor, session upload) and causes startup hangs.
# Feature gates are unlocked surgically in source code instead.
# The ("external" as string) → ("ant" as string) build-time replacement
# handles compile-time feature flags safely.
bun run build.ts 2>&1 | tail -1
exec bun dist/cli.js "$@"
