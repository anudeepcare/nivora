#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$PROJECT_ROOT/scripts/package_release.py" "${1:-$PROJECT_ROOT/../AURYN_REBUILD_SOURCE_AND_VERIFICATION.zip}"
