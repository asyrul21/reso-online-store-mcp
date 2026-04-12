# RESO Online Store MCP

An AWS Lambda-based **Model Context Protocol (MCP)** that provides an agentic AI layer over the [reso-online-store-server](../reso-online-store-server). The MCP receives natural language conversations, runs an OpenAI-powered agentic loop, and streams responses back to the React UI.

## Architecture

```
React UI
  │
  │  POST /mcp/admin or /mcp/client
  ▼
CloudFront Distribution  (HTTPS, custom domain support, SigV4 signing)
  │
  │  AWS_IAM signed request
  ▼
Lambda Function URL  (RESPONSE_STREAM — no 29s timeout)
  │
  │  awslambda.streamifyResponse
  ▼
Lambda Handler (src/index.ts)
  │
  ├── GET /api/auth/me  ──► online-store-server  (verify JWT, get user)
  │
  ├── OpenAI agentic loop (run.ts)
  │     ├── max 20 iterations
  │     ├── max 200,000 cumulative tokens
  │     └── tool calls ──► online-store-server REST API
  │
  └── Streams response back to React UI
```

### Key Design Decisions

- **No Prisma** — all data access via HTTP calls to `online-store-server`
- **Token forwarding** — every tool call forwards the user's JWT + `client-country-code` header
- **Auth type AWS_IAM** — Lambda Function URL is not publicly accessible; CloudFront signs requests using Origin Access Control (OAC) + SigV4
- **Additive** — `reso-online-store-server` works independently without this MCP

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20.x | [nodejs.org](https://nodejs.org) |
| npm | 10.x+ | Bundled with Node |
| TypeScript | 5.x | Included in devDependencies |
| AWS SAM CLI | 1.x | [aws.amazon.com/serverless/sam](https://aws.amazon.com/serverless/sam/) |
| AWS CLI | 2.x | [aws.amazon.com/cli](https://aws.amazon.com/cli/) |
| Docker | Any | Required for `sam local invoke` only |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `API_SERVER_URL` | Yes | Base URL of the `reso-online-store-server` |
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `OPENAI_MODEL` | No | Model to use (default: `gpt-4o`) |
| `MAX_ITERATIONS` | No | Max agentic loop iterations (default: `20`) |
| `MAX_TOTAL_TOKENS` | No | Max cumulative tokens per request (default: `200000`) |
| `PORT` | No | Local Express server port (default: `3001`) |

> **In AWS**: `OPENAI_API_KEY` is read from **AWS SSM Parameter Store** (SecureString) at path `/reso-mcp/openai-api-key`. Set it before deploying:
> ```bash
> aws ssm put-parameter \
>   --name /reso-mcp/openai-api-key \
>   --value "sk-..." \
>   --type SecureString
> ```

---

## 1. Build and Verify

```bash
# Install dependencies
npm install

# Build TypeScript (outputs to dist/)
npm run build

# Check for TypeScript errors without emitting
npx tsc --noEmit
```

If `npm run build` completes without errors, the project is correctly set up.

---

## 2. Local Development with Express Server

SAM local does **not** support Lambda Function URLs with `RESPONSE_STREAM`. Instead, use the built-in Express dev server which mirrors the Lambda handler behaviour.

### Step 1: Start the online-store-server

```bash
# In the reso-online-store-server directory
cd ../reso-online-store-server
npm run dev
# Server starts on http://localhost:8080
```

### Step 2: Start the MCP local server

```bash
# In this directory
npm run dev
# MCP server starts on http://localhost:3001
```

Or use the helper script:

```bash
./scripts/local.sh
```

### Step 3: Test with curl

**Health check** (no auth required):
```bash
curl http://localhost:3001/mcp/health
# { "status": "ok", "timestamp": "..." }
```

**Admin agent** (requires a valid JWT from the online-store-server):
```bash
curl -X POST http://localhost:3001/mcp/admin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "client-country-code: MY" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": [
      { "role": "user", "content": "How many categories do we have?" }
    ]
  }'
```

**Client agent** (any verified user):
```bash
curl -X POST http://localhost:3001/mcp/client \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "client-country-code: MY" \
  -H "Content-Type: application/json" \
  -d '{
    "conversation": [
      { "role": "user", "content": "Show me all available products" }
    ]
  }'
```

> Get a JWT by calling `POST http://localhost:8080/api/auth/signin` on the online-store-server.

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <jwt>` from online-store-server sign-in |
| `client-country-code` | Yes | ISO country code (e.g. `MY`, `SG`, `US`) |
| `Content-Type` | Yes | `application/json` |

### Optional Query Parameters

| Parameter | Description |
|-----------|-------------|
| `currency` | Currency code (e.g. `MYR`, `USD`). If omitted, derived from country code. |

---

## 3. Testing with SAM Local Invoke (Non-Streaming)

`sam local invoke` runs the Lambda handler directly using Docker. Streaming is not supported, but it's useful for testing cold starts and event parsing.

### Setup `.env.json` for SAM

Create a `.env.json` file (gitignored):

```json
{
  "McpFunction": {
    "API_SERVER_URL": "http://host.docker.internal:8080",
    "OPENAI_API_KEY": "sk-...",
    "OPENAI_MODEL": "gpt-4o",
    "MAX_ITERATIONS": "20",
    "MAX_TOTAL_TOKENS": "200000"
  }
}
```

> `host.docker.internal` resolves to your Mac host from inside Docker containers (where SAM runs).

### Update event files with a real JWT

Edit `events/admin-event.json` and replace `YOUR_JWT_TOKEN_HERE` with a real token.

### Invoke

```bash
# Build first
npm run build && sam build

# Invoke health check
sam local invoke McpFunction -e events/health-event.json

# Invoke admin agent
sam local invoke McpFunction -e events/admin-event.json --env-vars .env.json

# Invoke client agent
sam local invoke McpFunction -e events/client-event.json --env-vars .env.json
```

---

## 4. Deploying to AWS

Infrastructure-as-code lives in `infra/`. The CI/CD pipeline (`reso-infra` kit) deploys via CloudFormation — no SAM CLI needed in the pipeline.

```
infra/
├── cert-stack.yml   — ACM certificate (deployed in us-east-1)
└── app-stack.yml    — Lambda + CloudFront stack
```

### Step 1 — Set the OpenAI API key in SSM

The OpenAI key is stored as a SecureString in SSM Parameter Store and resolved at CloudFormation deploy time. Set it once:

```bash
aws ssm put-parameter \
  --name /reso-mcp/openai-api-key \
  --value "sk-..." \
  --type SecureString \
  --region ap-southeast-1
```

### Step 2 — Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions** in this repo and add:

**Required**

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | `github-deployer` access key (from `reso-infra` bootstrap) |
| `AWS_SECRET_ACCESS_KEY` | `github-deployer` secret key |
| `APP_NAME` | `reso-online-store-mcp` |
| `DOMAIN_NAME` | Custom domain (e.g. `mcp.reso-store.com`) |
| `HOSTED_ZONE_ID` | Route 53 Hosted Zone ID |
| `API_SERVER_URL` | Base URL of the online-store-server (e.g. `https://api.reso-store.com`) |
| `CLIENT_DOMAIN_URLS` | Comma-separated allowed client origins (e.g. `https://reso-store.com`) |

**Optional — sensible defaults pre-configured**

| Secret | Default | Description |
|---|---|---|
| `AWS_REGION` | `ap-southeast-1` | Target AWS region |
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model |
| `MAX_ITERATIONS` | `20` | Max agentic loop iterations |
| `MAX_TOTAL_TOKENS` | `200000` | Max cumulative tokens per request |
| `MEMORY_SIZE` | `512` | Lambda memory in MB |
| `TIMEOUT` | `900` | Lambda timeout in seconds |

> The OpenAI API key does **not** need a GitHub Secret — it is read directly from SSM Parameter Store (`/reso-mcp/openai-api-key`) by CloudFormation at deploy time.

### Step 3 — Deploy

**Push to `main`** — the pipeline runs three jobs: `ci → infra → deploy`.

- `ci` — build TypeScript, prune dev deps, zip artifact
- `infra` — deploy cert stack to `us-east-1` (idempotent), deploy app stack (idempotent)
- `deploy` — `aws lambda update-function-code`, wait, invalidate CloudFront

Or trigger manually: **GitHub → Actions → CI/CD Deploy → Run workflow**.

---

## 5. Triggering the Lambda via AWS Web Console

1. Go to **AWS Console → Lambda → reso-online-store-mcp-prod → Test**
2. Create a new test event. Use the JSON below as a template.

### Test Event: Health Check

```json
{
  "rawPath": "/mcp/health",
  "requestContext": {
    "http": { "method": "GET" }
  },
  "headers": {},
  "queryStringParameters": {},
  "body": null
}
```

### Test Event: Admin Agent

```json
{
  "rawPath": "/mcp/admin",
  "requestContext": {
    "http": { "method": "POST" }
  },
  "headers": {
    "authorization": "Bearer YOUR_JWT_TOKEN",
    "client-country-code": "MY",
    "content-type": "application/json"
  },
  "queryStringParameters": {
    "currency": "MYR"
  },
  "body": "{\"conversation\":[{\"role\":\"user\",\"content\":\"How many products do we have?\"}]}"
}
```

### Test Event: Client Agent

```json
{
  "rawPath": "/mcp/client",
  "requestContext": {
    "http": { "method": "POST" }
  },
  "headers": {
    "authorization": "Bearer YOUR_JWT_TOKEN",
    "client-country-code": "MY",
    "content-type": "application/json"
  },
  "queryStringParameters": {},
  "body": "{\"conversation\":[{\"role\":\"user\",\"content\":\"Show me all available products\"}]}"
}
```

> Note: The Lambda Console does not support streaming; the full response is buffered. For real streaming, call through CloudFront or the local Express server.

---

## 6. Stream Response Format

The response is a chunked text stream. Each logical block is wrapped in `<output>` tags:

```
<output>I'm checking the categories now...</output>
<output>{"meta":{"type":"function_call","name":"getCategoriesAdmin","arguments":"{}","call_id":"call_abc","id":"fc_xyz","status":"completed"}}</output>
<output>{"meta":{"type":"function_call_output","call_id":"call_abc","output":"[{\"id\":\"cat1\",\"name\":\"T-Shirts\"}]"}}</output>
<output>I found 3 categories: T-Shirts, Trousers, and Hoodies.
{"meta":{"goalStatus":"SUCCESS","chatStatus":"COMPLETED"}}</output>
{"streamCompletedAt":"2026-03-11T10:00:00.000Z"}
```

**Chunk types:**
- Text deltas inside `<output>...</output>` — stream directly to UI
- `{"meta":{...}}` blocks inside `<output>` — tool call and tool result metadata
- `{"streamCompletedAt":"..."}` — final chunk, stream complete
- `{"streamError":{"status":500,"message":"..."}}` — error, stream terminated

---

## 7. Enabling Custom Domain

Custom domain is handled automatically by the CI/CD pipeline via the `DOMAIN_NAME`, `HOSTED_ZONE_ID`, and the cert stack deployed to `us-east-1`.

1. Add `DOMAIN_NAME` (e.g. `mcp.reso-store.com`) and `HOSTED_ZONE_ID` as GitHub Secrets (see Step 2 in Section 4 above).
2. Push to `main` — the pipeline deploys the ACM cert (DNS-validated via Route 53) and creates the Route 53 alias record pointing to CloudFront automatically.
3. After deploy, get the live URL from the stack outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name reso-online-store-mcp-stack \
     --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" \
     --output text
   ```

---

## 8. Replicating This Project for a New Backend

This MCP is designed as a reusable template. To adapt it for a different backend:

### Step 1: Fork/Clone

```bash
git clone https://github.com/your-org/reso-online-store-mcp.git your-new-mcp
cd your-new-mcp
```

### Step 2: Add `GET /api/auth/me` to your backend

Your backend needs an endpoint that verifies a JWT and returns the user object. It must return:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "...",
    "name": "...",
    "isActive": true,
    "isVerified": true,
    "userType": { "id": "...", "name": "administrator" }
  }
}
```

The MCP checks `userType.name === 'administrator'` to gate admin access.

### Step 3: Update `.env.example` and `.env`

```bash
API_SERVER_URL=https://your-new-backend.com
```

### Step 4: Replace the tools

Delete the existing tool files in `src/lib/ai/tools/` and create new ones matching your backend's REST API:

```typescript
// src/lib/ai/tools/myResource.tool.ts
import { AiAgentTool, ToolContext } from '../types';

export const getMyResources: AiAgentTool = {
  meta: {
    type: 'function',
    name: 'getMyResources',
    description: 'Fetch all resources from the new backend.',
    parameters: null,
  },
  fn: async (_args, ctx: ToolContext) => {
    return ctx.serverClient.get('/api/my-resource');
  },
};
```

### Step 5: Update the tool registry

Edit `src/lib/ai/tools/index.ts` to import and register your new tools.

### Step 6: Update the system prompts

Edit `src/lib/ai/prompts/agent.ts` to describe your new domain.

### Step 7: Update `samconfig.toml`

```toml
[dev.deploy.parameters]
stack_name = "your-new-mcp-dev"
parameter_overrides = [
  "Environment=dev",
  "ApiServerUrl=https://your-new-backend.com",
  ...
]
```

### Step 8: Add SSM parameter for OpenAI key

```bash
aws ssm put-parameter \
  --name /your-project/openai-api-key \
  --value "sk-..." \
  --type SecureString
```

### Step 9: Deploy

Deploy via GitHub Actions. Push to the relevant branch to trigger the workflow.

The framework (Lambda handler, Express local server, run.ts, HTTP client, auth module, CloudFront + OAC, GitHub Actions) stays identical.

---

## Token Usage and Cost

| Scenario | Typical tokens | Estimated cost (GPT-4o) |
|----------|----------------|-------------------------|
| Simple query (1-2 tool calls) | ~15K-30K | ~$0.03-$0.07 |
| Complex task (3-5 tool calls) | ~40K-80K | ~$0.10-$0.20 |
| Max budget (20 iterations) | ~200K | ~$0.50-$0.75 |

Token usage is logged to **CloudWatch Logs** in structured JSON format:

```json
{
  "type": "token_usage",
  "iteration": 2,
  "input_tokens": 12500,
  "output_tokens": 850,
  "total_tokens": 13350,
  "cumulative_tokens": 26700
}
```

Find logs in: **CloudWatch → Log groups → `/aws/lambda/reso-online-store-mcp-prod`** (log group is pre-created by CloudFormation with 30-day retention)
