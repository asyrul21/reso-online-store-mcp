#!/bin/bash
# ────────────────────────────────────────────────────────────────
# Start the local Express development server
# Requires the online-store-server to be running on :8080
#
# Usage: ./scripts/local.sh
# ────────────────────────────────────────────────────────────────

set -e

if [ ! -f ".env" ]; then
  echo "Warning: .env file not found. Copying from .env.example..."
  cp .env.example .env
  echo "Please update .env with your API keys and re-run."
  exit 1
fi

echo "Starting MCP local server..."
echo "Make sure the online-store-server is running on http://localhost:8080"
echo ""
npm run dev
