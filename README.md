# Codex Core

**Designator:** #CODEX-CORE  
**Version:** 0.1.0  
**Status:** First Stable Foundation

Dual-mode (on/offline) AI system with:

- Persistent, portable memory independent of any single chat thread
- Controlled mutagenic / emergent idea accumulation
- Double-audit + pre-creation testing
- Dual-read artifacts (human-readable + machine-readable)
- Offline-first with graceful online enrichment
- Tlalli-Keeton Entity as Mutagenic Custodian

## What’s Live in 0.1.0

- Three core JSON Schemas
- Tlalli-Keeton issues real MutationReceipts after double-audit
- Approved receipts attempt write to D1 Delta Ledger (graceful)
- `GET /entity/ledger-status` — dual-store health
- `GET /entity/receipt/:id` — dual-read HTML viewer (save for offline)
- Clear deploy path in `app/DEPLOY.md`

## Quick Links

- [Full Architecture](01-overview/ARCHITECTURE.md)
- [JSON Schemas](02-schemas/)
- [Safety / Double-Audit](04-safety/)
- [Cloudflare App + Deploy](app/DEPLOY.md)

## Core Principles

1. Nothing valuable is ever scrapped — mutagenic accumulation
2. Double audit before creation — structural + stability
3. Portable dual-read artifacts
4. Offline-first with graceful online enrichment
5. Baseline preservation — non-override protocol
6. Receipt as contract

## Deploy in 60 seconds

```bash
cd app
npm install
npx wrangler login
npx wrangler d1 create codex-delta-ledger   # paste ID into wrangler.toml
npx wrangler d1 execute codex-delta-ledger --file=./d1-schema.sql
npx wrangler dev
```

Then:

```bash
curl -X POST http://localhost:8787/entity/propose \
  -H "Content-Type: application/json" \
  -d '{"type":"idea-accumulation","summary":"Test the dual-read viewer"}'
```

Open the `viewer` URL from the response for the dual-read card.
