#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
# Set USER_TYPE=ant for dev mode to unlock ant-only features at runtime
# (build mode handles this via build.ts process.env.USER_TYPE replacement)
export USER_TYPE=ant
bun run build.ts 2>&1 | tail -1
exec bun dist/cli.js "$@"
