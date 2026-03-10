#!/bin/bash
# Sync shared frontend code from ai-suites (desktop) to ai-suites-web.
# Copies everything EXCEPT web-specific files that have diverged.
#
# Usage: ./sync-from-desktop.sh
#        ./sync-from-desktop.sh --dry-run    (preview changes without copying)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/../ai-suites" && pwd)"
DRY_RUN=""

if [ "$1" = "--dry-run" ]; then
  DRY_RUN="--dry-run"
  echo "=== DRY RUN — no files will be changed ==="
  echo ""
fi

if [ ! -d "$SOURCE_DIR/src" ]; then
  echo "Error: ai-suites not found at $SOURCE_DIR"
  exit 1
fi

echo "Syncing from $SOURCE_DIR → $SCRIPT_DIR"
echo ""

# Files/dirs that are WEB-ONLY and should NEVER be overwritten
EXCLUDE_LIST=(
  "src/main.tsx"
  "src/services/backend.ts"
  "src/services/web-backend.ts"
  "src/types/global.d.ts"
  "src/components/PasswordGate.tsx"
)

# Build rsync exclude args
EXCLUDES=""
for item in "${EXCLUDE_LIST[@]}"; do
  EXCLUDES="$EXCLUDES --exclude=$item"
done

# Sync shared directories
SHARED_DIRS=(
  "src/components"
  "src/pages"
  "src/stores"
  "src/styles"
  "src/utils"
  "src/api"
  "src/services"
  "src/types"
  "src/hooks"
  "src/design-system"
  "public"
  "skills"
)

for dir in "${SHARED_DIRS[@]}"; do
  if [ -d "$SOURCE_DIR/$dir" ]; then
    echo "  Syncing $dir/"
    rsync -av --delete $DRY_RUN $EXCLUDES "$SOURCE_DIR/$dir/" "$SCRIPT_DIR/$dir/"
  fi
done

# Sync individual root-level files
ROOT_FILES=(
  "src/App.tsx"
  "src/vite-env.d.ts"
)

for file in "${ROOT_FILES[@]}"; do
  if [ -f "$SOURCE_DIR/$file" ]; then
    echo "  Syncing $file"
    rsync -av $DRY_RUN "$SOURCE_DIR/$file" "$SCRIPT_DIR/$file"
  fi
done

echo ""
echo "Sync complete!"
echo ""
echo "Web-only files preserved (never overwritten):"
for item in "${EXCLUDE_LIST[@]}"; do
  echo "  - $item"
done
echo ""
echo "Next steps:"
echo "  1. Review changes:  git diff"
echo "  2. Test locally:    npm run dev"
echo "  3. Deploy:          git add -A && git commit -m 'Sync from desktop' && git push"
