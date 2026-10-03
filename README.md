# Codex Core

**Designator:** #CODEX-CORE  
**Version:** 0.1.0-draft  
**Status:** Schemas live · Receipt issuer active · Ready for D1 bind + deploy

Dual-mode (on/offline) AI system with:

- Persistent, portable memory independent of any single chat thread
- Controlled mutagenic / emergent idea accumulation
- Double-audit + pre-creation testing
- Dual-read artifacts (human-readable + machine-readable)
- Offline-first with graceful online enrichment
- Tlalli-Keeton Entity as Mutagenic Custodian

## Quick Links

- [Full Architecture](01-overview/ARCHITECTURE.md)
- [JSON Schemas](02-schemas/) — MutationReceipt · DualReadArtifact · RiskGateDecision
- [Safety / Double-Audit](04-safety/)
- [Cloudflare App](app/) + [Deploy Guide](app/DEPLOY.md)

## Core Principles

1. Nothing valuable is ever scrapped — mutagenic accumulation
2. Double audit before creation — structural + stability
3. Portable dual-read artifacts
4. Offline-first with graceful online enrichment
5. Baseline preservation — non-override protocol
6. Receipt as contract

## What’s Live Right Now

- Three core JSON Schemas committed
- Tlalli-Keeton Durable Object issues real MutationReceipts after double-audit
- `POST /entity/propose` endpoint ready
- D1 schema + clear bind instructions in `app/DEPLOY.md`
- Local dev + edge deploy path documented

## Structure

```
01-overview/     → Architecture + system context
02-schemas/      → JSON Schemas (live)
03-modules/      → Individual module specifications
04-safety/       → Audit, risk gates, test protocols
05-entity/       → Tlalli-Keeton definition & behavior
06-integration/  → How layers connect + extension points
app/             → Cloudflare Workers + Durable Objects
```

## Next 60 seconds

```bash
cd app
npm install
npx wrangler login
npx wrangler d1 create codex-delta-ledger   # paste ID into wrangler.toml
npx wrangler d1 execute codex-delta-ledger --file=./d1-schema.sql
npx wrangler dev
```

Then hit `POST /entity/propose` and watch Tlalli-Keeton issue a receipt.
