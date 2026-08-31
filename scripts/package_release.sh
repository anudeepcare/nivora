#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/../NIVORA_RELEASE.zip}"
cd "$ROOT"
rm -f "$OUT"
zip -qr "$OUT" . \
  -x '.env*' '.git/*' '.next/*' 'node_modules/*' '__MACOSX/*' '*.DS_Store' '*/__pycache__/*' '*.pyc' 'tsconfig.tsbuildinfo'
echo "$OUT"
