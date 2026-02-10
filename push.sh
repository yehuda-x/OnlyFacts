#!/bin/bash
# Push changes to GitHub repository

cd /workspaces/OnlyFacts

echo "📊 Checking git status..."
git status

echo ""
echo "📦 Staging all changes..."
git add .

echo ""
echo "💾 Committing changes..."
git commit -m "🚀 Futuristic design: dark theme, animations, enriched 1000-char content & 18 research studies"

echo ""
echo "🚀 Pushing to main branch..."
git push origin main

echo ""
echo "✅ Push complete! Your site is now live on GitHub Pages."
