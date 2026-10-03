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

## Test the receipt issuer + D1 write

```bash
curl -X POST http://localhost:8787/entity/propose \
  -H "Content-Type: application/json" \
  -d '{
    "type": "idea-accumulation",
    "summary": "Add offline dual-read receipt viewer",
    "payload": { "priority": "high" }
  }'
```

You should receive a full MutationReceipt.  
Look at the new `ledger` field:
- `d1Written: true` → successfully persisted to Delta Ledger
- `d1Written: false` + note about unbound → still living safely in the Durable Object until you bind the real database_id

## Current status (Option 2 complete)
- Schemas: live
- Receipt issuer: wired + double-audit enforced
- D1 write path: implemented and graceful
- Offline dual-read viewer: refined and parked (ready for next activation)
