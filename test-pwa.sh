#!/bin/bash

# Script to test PWA locally
# Usage: ./test-pwa.sh

echo "🚀 Building production version..."
npm run build

echo ""
echo "📦 Starting local server..."
echo "🌐 Open http://localhost:8080 in your browser"
echo ""
echo "✅ To check Service Worker:"
echo "   1. Open DevTools (F12)"
echo "   2. Go to Application → Service Workers"
echo "   3. You should see 'ngsw-worker.js' activated"
echo ""
echo "⌨️  Press Ctrl+C to stop the server"
echo ""

cd dist/save-to-dream/browser && npx http-server -p 8080 -c-1
