#!/bin/bash
# Setup script for ai-suites-web
# Creates symlinks to share frontend source code from ai-suites

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$(cd "$SCRIPT_DIR/../ai-suites" && pwd)"

if [ ! -d "$SOURCE_DIR/src" ]; then
  echo "Error: ai-suites project not found at $SOURCE_DIR"
  exit 1
fi

echo "Setting up symlinks from $SOURCE_DIR..."

# Symlink shared frontend directories
# These are the parts of src/ that don't depend on Electron
SHARED_DIRS=(
  "components"
  "pages"
  "stores"
  "styles"
  "utils"
  "api"
  "hooks"
)

for dir in "${SHARED_DIRS[@]}"; do
  if [ -d "$SOURCE_DIR/src/$dir" ]; then
    # Remove existing symlink or directory
    rm -rf "$SCRIPT_DIR/src/$dir"
    ln -sf "$SOURCE_DIR/src/$dir" "$SCRIPT_DIR/src/$dir"
    echo "  Linked src/$dir"
  fi
done

# Types: symlink individual files (not the directory) to keep local global.d.ts
mkdir -p "$SCRIPT_DIR/src/types"
for f in "$SOURCE_DIR/src/types/"*; do
  name=$(basename "$f")
  if [ "$name" != "global.d.ts" ]; then
    rm -f "$SCRIPT_DIR/src/types/$name"
    ln -sf "$f" "$SCRIPT_DIR/src/types/$name"
  fi
done
echo "  Linked src/types/* (except global.d.ts)"

# Services: symlink individual files to keep local backend.ts and web-backend.ts
mkdir -p "$SCRIPT_DIR/src/services"
for f in "$SOURCE_DIR/src/services/"*; do
  name=$(basename "$f")
  rm -f "$SCRIPT_DIR/src/services/$name"
  ln -sf "$f" "$SCRIPT_DIR/src/services/$name"
done
echo "  Linked src/services/*"

# Symlink App.tsx
if [ -f "$SOURCE_DIR/src/App.tsx" ]; then
  rm -f "$SCRIPT_DIR/src/App.tsx"
  ln -sf "$SOURCE_DIR/src/App.tsx" "$SCRIPT_DIR/src/App.tsx"
  echo "  Linked src/App.tsx"
fi

# Symlink vite-env.d.ts
if [ -f "$SOURCE_DIR/src/vite-env.d.ts" ]; then
  rm -f "$SCRIPT_DIR/src/vite-env.d.ts"
  ln -sf "$SOURCE_DIR/src/vite-env.d.ts" "$SCRIPT_DIR/src/vite-env.d.ts"
  echo "  Linked src/vite-env.d.ts"
fi

# Symlink public assets
if [ -d "$SOURCE_DIR/public" ]; then
  rm -rf "$SCRIPT_DIR/public"
  ln -sf "$SOURCE_DIR/public" "$SCRIPT_DIR/public"
  echo "  Linked public/"
fi

# Symlink skills (for system prompt loading)
if [ -d "$SOURCE_DIR/skills" ]; then
  rm -rf "$SCRIPT_DIR/skills"
  ln -sf "$SOURCE_DIR/skills" "$SCRIPT_DIR/skills"
  echo "  Linked skills/"
fi

# Symlink design system if it exists
if [ -d "$SOURCE_DIR/src/design-system" ]; then
  rm -rf "$SCRIPT_DIR/src/design-system"
  ln -sf "$SOURCE_DIR/src/design-system" "$SCRIPT_DIR/src/design-system"
  echo "  Linked src/design-system"
fi

echo ""
echo "Setup complete! Now run:"
echo "  npm install"
echo "  cp .env.example .env  # then edit with your API key"
echo "  npm run dev"
