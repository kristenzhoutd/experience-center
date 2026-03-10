#!/bin/bash
# Sync shared frontend code from ai-suites (desktop) to ai-suites-web.
# Copies everything EXCEPT web-specific files that have diverged.
#
# Creates a new branch for review before merging to main.
#
# Usage: ./sync-from-desktop.sh              (sync to a new branch)
#        ./sync-from-desktop.sh --dry-run    (preview changes without copying)
#        ./sync-from-desktop.sh --direct     (sync directly on current branch, no new branch)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/../ai-suites" && pwd)"
DRY_RUN=""
DIRECT=""

for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN="--dry-run" ;;
    --direct)  DIRECT="true" ;;
  esac
done

if [ -n "$DRY_RUN" ]; then
  echo "=== DRY RUN — no files will be changed ==="
  echo ""
fi

if [ ! -d "$SOURCE_DIR/src" ]; then
  echo "Error: ai-suites not found at $SOURCE_DIR"
  exit 1
fi

# Create a sync branch (unless --direct or --dry-run)
BRANCH_NAME=""
if [ -z "$DRY_RUN" ] && [ -z "$DIRECT" ]; then
  BRANCH_NAME="sync/desktop-$(date +%Y-%m-%d-%H%M)"
  echo "Creating branch: $BRANCH_NAME"
  git -C "$SCRIPT_DIR" checkout main 2>/dev/null
  git -C "$SCRIPT_DIR" pull 2>/dev/null
  git -C "$SCRIPT_DIR" checkout -b "$BRANCH_NAME"
  echo ""
fi

echo "Syncing from $SOURCE_DIR → $SCRIPT_DIR"
echo ""

# Files that are WEB-ONLY and should NEVER be overwritten.
# Paths are relative to the project root. The script extracts the filename
# and uses rsync --filter to both exclude from copy and protect from deletion.
EXCLUDE_LIST=(
  "src/main.tsx"
  "src/services/backend.ts"
  "src/services/web-backend.ts"
  "src/types/global.d.ts"
  "src/components/PasswordGate.tsx"
)

# Build rsync filter args — protect files by basename within each synced directory
# We use --filter='P filename' (protect from delete) and --exclude='filename' (skip from source)
build_filters_for_dir() {
  local dir="$1"
  local filters=""
  for item in "${EXCLUDE_LIST[@]}"; do
    # Check if this exclude belongs to the directory being synced
    local item_dir=$(dirname "$item")
    if [ "$item_dir" = "$dir" ]; then
      local basename=$(basename "$item")
      filters="$filters --filter=P_${basename} --exclude=${basename}"
    fi
  done
  echo "$filters"
}

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
  "src/constants"
  "src/config"
  "src/design-system"
  "public"
  "skills"
)

for dir in "${SHARED_DIRS[@]}"; do
  if [ -d "$SOURCE_DIR/$dir" ]; then
    echo "  Syncing $dir/"
    DIR_FILTERS=$(build_filters_for_dir "$dir")
    rsync -av --delete $DRY_RUN $DIR_FILTERS "$SOURCE_DIR/$dir/" "$SCRIPT_DIR/$dir/"
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
echo "Web-only files preserved (never overwritten):"
for item in "${EXCLUDE_LIST[@]}"; do
  echo "  - $item"
done

if [ -n "$DRY_RUN" ]; then
  echo ""
  echo "Dry run complete. Run without --dry-run to apply changes."
  exit 0
fi

echo ""
if [ -n "$BRANCH_NAME" ]; then
  # Commit and push the branch
  git -C "$SCRIPT_DIR" add -A
  CHANGED=$(git -C "$SCRIPT_DIR" diff --cached --stat)
  if [ -z "$CHANGED" ]; then
    echo "No changes to sync — desktop and web are already in sync."
    git -C "$SCRIPT_DIR" checkout main
    git -C "$SCRIPT_DIR" branch -d "$BRANCH_NAME"
    exit 0
  fi

  git -C "$SCRIPT_DIR" commit -m "Sync from desktop $(date +%Y-%m-%d)"
  git -C "$SCRIPT_DIR" push -u origin "$BRANCH_NAME"

  echo ""
  echo "=== Done! ==="
  echo ""
  echo "Branch '$BRANCH_NAME' pushed. Next steps:"
  echo ""
  echo "  1. Test locally:     npm run dev"
  echo "  2. Create PR:        gh pr create --title 'Sync from desktop' --body 'Automated sync from ai-suites desktop app'"
  echo "  3. After testing:    git checkout main && git merge $BRANCH_NAME && git push"
  echo ""
else
  echo "Sync complete. Review with 'git diff' and commit when ready."
fi
