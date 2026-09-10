#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v git >/dev/null 2>&1; then
  echo "[install-secret-hook] ERROR: git is required" >&2
  exit 1
fi

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "[install-secret-hook] ERROR: this folder is not a git repository" >&2
  exit 1
fi

chmod +x "$ROOT_DIR/scripts/secret-scan.sh"
chmod +x "$ROOT_DIR/.githooks/pre-commit"

git -C "$ROOT_DIR" config core.hooksPath .githooks

echo "[install-secret-hook] Installed pre-commit secret scan hook"
echo "[install-secret-hook] Hook path: $ROOT_DIR/.githooks/pre-commit"
