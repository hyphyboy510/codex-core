# Codex Core — Cloudflare Deploy Guide

## Prerequisites
- Cloudflare account
- Node.js 18+
- `npm install -g wrangler` (or use npx)

## One-time setup

```bash
cd app
npm install

# 1. Login
npx wrangler login

# 2. Create the D1 database
npx wrangler d1 create codex-delta-ledger
# → copy the database_id that is printed

# 3. Paste the database_id into wrangler.toml
#    Replace REPLACE_WITH_REAL_ID

# 4. Apply schema
npx wrangler d1 execute codex-delta-ledger --file=./d1-schema.sql

# 5. Local dev
npx wrangler dev

# 6. Deploy to edge
npx wrangler deploy
```

## Test the receipt issuer

```bash
curl -X POST http://localhost:8787/entity/propose \
  -H "Content-Type: application/json" \
  -d '{
    "type": "idea-accumulation",
    "summary": "Add offline dual-read receipt viewer",
    "payload": { "priority": "high" }
  }'
```

You should receive a full MutationReceipt with structural + stability audit results.

## Current status
- Schemas: live in /02-schemas
- Receipt issuer: wired and double-audit enforced
- D1: ready for your database_id
- Offline path: still deferred (as designed)
