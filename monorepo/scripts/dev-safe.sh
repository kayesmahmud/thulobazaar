#!/bin/bash

# Safe dev server starter - prevents multiple instances
# Usage: ./scripts/dev-safe.sh web|api

set -e

PROJECT_DIR="/Users/elw/Documents/Web/thulobazaar/monorepo"
cd "$PROJECT_DIR"

# Check which service to start
SERVICE="$1"
if [ -z "$SERVICE" ]; then
  echo "❌ Usage: $0 [web|api]"
  exit 1
fi

# Define port based on service
if [ "$SERVICE" = "web" ]; then
  PORT=3333
  CMD="npm run dev:web"
elif [ "$SERVICE" = "api" ]; then
  PORT=5000
  CMD="npm run dev:api"
else
  echo "❌ Invalid service. Use 'web' or 'api'"
  exit 1
fi

# Check if port is already in use
if lsof -ti:$PORT > /dev/null 2>&1; then
  echo "⚠️  Port $PORT is already in use by another process"
  echo "🔍 Checking if it's a dev server..."

  # Kill the existing process
  echo "🛑 Killing existing process on port $PORT..."
  lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
  sleep 1

  echo "✅ Port $PORT is now free"
fi

# Count total running dev processes
DEV_COUNT=$(ps aux | grep -E "npm run dev|turbo run dev" | grep -v grep | wc -l | tr -d ' ')

if [ "$DEV_COUNT" -ge 2 ]; then
  echo "⚠️  WARNING: Already $DEV_COUNT dev processes running"
  echo "📋 Current processes:"
  ps aux | grep -E "npm run dev|turbo run dev" | grep -v grep | awk '{print "  - PID " $2 ": " $11 " " $12 " " $13}'
  echo ""
  echo "💡 Kill old processes? (y/n)"
  read -r response
  if [ "$response" = "y" ]; then
    echo "🛑 Killing all dev processes..."
    pkill -f "npm run dev" || true
    pkill -f "turbo run dev" || true
    sleep 2
    echo "✅ Old processes killed"
  else
    echo "❌ Aborting to prevent too many processes"
    exit 1
  fi
fi

# Start the service
echo "🚀 Starting $SERVICE on port $PORT..."
exec $CMD
