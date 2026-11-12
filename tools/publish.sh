#!/bin/bash
# Puts the current app (the public/ folder) online as the GitHub Pages preview.
# Run from anywhere:  bash tools/publish.sh
set -e
cd "$(dirname "$0")/.."
git push origin main
git push origin "$(git subtree split --prefix public main)":refs/heads/gh-pages --force
echo "Published. The page updates in about a minute."
