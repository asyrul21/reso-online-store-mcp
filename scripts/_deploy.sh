#!/bin/bash
# ────────────────────────────────────────────────────────────────
# Local CLI deploy script
# Usage:
#   ./scripts/deploy.sh          # Deploy to dev (default)
#   ./scripts/deploy.sh dev      # Deploy to dev
#   ./scripts/deploy.sh prod     # Deploy to prod (prompts for changeset confirmation)
# ────────────────────────────────────────────────────────────────

set -e

ENV="${1:-dev}"

if [[ "$ENV" != "dev" && "$ENV" != "prod" ]]; then
  echo "Error: Invalid environment '$ENV'. Use 'dev' or 'prod'."
  exit 1
fi

echo "Building TypeScript..."
npm run build

echo "Running SAM build..."
sam build

echo "Deploying to '$ENV'..."
sam deploy --config-env "$ENV" --no-fail-on-empty-changeset

echo ""
echo "Deployment complete. Stack outputs:"
STACK_NAME="reso-online-store-mcp-${ENV}"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs" \
  --output table
