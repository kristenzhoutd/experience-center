#!/bin/bash
# Resolve symlinks into actual copies for deployment.
# Run this before deploying to Vercel (or any platform where
# the ai-suites sibling project isn't available).

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Resolving symlinks for deployment..."

# Find all symlinks under src/ and replace with copies
find "$SCRIPT_DIR/src" -type l | while read -r link; do
  target=$(readlink "$link")
  if [ -e "$target" ]; then
    rm "$link"
    if [ -d "$target" ]; then
      cp -R "$target" "$link"
    else
      cp "$target" "$link"
    fi
    echo "  Copied: ${link#$SCRIPT_DIR/}"
  else
    echo "  Warning: broken symlink ${link#$SCRIPT_DIR/} -> $target"
  fi
done

# Handle public/ and skills/ symlinks
for dir in public skills; do
  link="$SCRIPT_DIR/$dir"
  if [ -L "$link" ]; then
    target=$(readlink "$link")
    if [ -e "$target" ]; then
      rm "$link"
      cp -R "$target" "$link"
      echo "  Copied: $dir/"
    fi
  fi
done

echo ""
echo "Done! The project is now self-contained and ready for deployment."
echo ""
echo "Next steps:"
echo "  vercel --prod"
