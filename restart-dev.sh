#!/bin/bash

# Quick script to restart the dev server and clear cache

echo "🔄 Restarting Napkin AI..."

# Kill any running Next.js processes
echo "Stopping existing server..."
pkill -f "next dev" || true

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next

# Clear node modules cache (optional)
# rm -rf node_modules/.cache

# Restart the dev server
echo "Starting fresh dev server..."
npm run dev
