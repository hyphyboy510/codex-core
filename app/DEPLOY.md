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


## Automatic deploy

Pushes to `main` deploy the Worker in `app/` through GitHub Actions (`.github/workflows/deploy.yml`) using `cloudflare/wrangler-action`. The workflow needs two repository secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. No secrets are stored in this repo.

The D1 database `codex-delta-ledger` (database_id `70da63f1-f9a0-4dfc-8fd8-985a32e778cb`) has been created and the schema in `d1-schema.sql` applied.
