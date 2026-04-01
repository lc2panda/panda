#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
bun run build.ts 2>&1 | tail -1
exec bun dist/cli.js "$@"
