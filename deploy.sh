#!/bin/bash
# Spendly - One-Command Deploy to Netlify
# Run: bash deploy.sh

echo "🚀 Deploying Spendly to Netlify..."

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Check if already logged in
if ! netlify status &> /dev/null; then
    echo "Please log in to Netlify..."
    netlify login
fi

# Deploy!
netlify deploy --prod --dir=dist --message="Spendly v1.0"

echo "✅ Deployed! Your Spendly app is live."
