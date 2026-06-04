#!/bin/bash
# Push prism-app to GitHub
set -e

echo "=== Initialising git repo ==="
git init
git add .
git commit -m "Initial commit"
git branch -M main

echo "=== Adding remote ==="
git remote add origin https://github.com/robertbkye-beep/prism-app.git

echo "=== Pushing to GitHub ==="
git push -u origin main

echo "=== Done! ==="
