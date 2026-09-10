#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() {
  printf '[secret-scan] %s\n' "$1"
}

fail() {
  printf '[secret-scan] ERROR: %s\n' "$1" >&2
  exit 1
}

if ! command -v git >/dev/null 2>&1; then
  fail "git is required"
fi

if ! git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "this folder is not a git repository"
fi

STAGED_FILES="$(git -C "$ROOT_DIR" diff --cached --name-only --diff-filter=ACMR)"
if [[ -z "$STAGED_FILES" ]]; then
  log "No staged files to scan"
  exit 0
fi

TMP_DIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

while IFS= read -r rel_path; do
  [[ -z "$rel_path" ]] && continue

  # Skip deleted/missing entries and extract exact staged content from git index.
  if ! git -C "$ROOT_DIR" cat-file -e ":$rel_path" 2>/dev/null; then
    continue
  fi

  target="$TMP_DIR/$rel_path"
  mkdir -p "$(dirname "$target")"
  git -C "$ROOT_DIR" show ":$rel_path" > "$target"
done <<< "$STAGED_FILES"

if command -v gitleaks >/dev/null 2>&1; then
  log "Scanning staged content with local gitleaks"
  if gitleaks detect --no-git --source "$TMP_DIR" --redact; then
    log "No leaks found"
    exit 0
  fi

  fail "Potential secret(s) detected. Remove them before commit."
fi

if command -v docker >/dev/null 2>&1; then
  log "Local gitleaks not found; scanning with Docker image"
  if docker run --rm -v "$TMP_DIR:/repo" zricethezav/gitleaks:latest detect --no-git --source /repo --redact; then
    log "No leaks found"
    exit 0
  fi

  fail "Potential secret(s) detected. Remove them before commit."
fi

fail "Neither gitleaks nor docker are installed. Install gitleaks or Docker to enable pre-commit secret scanning."
