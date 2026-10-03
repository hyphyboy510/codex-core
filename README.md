# Codex Core

**Designator:** #CODEX-CORE  
**Version:** 0.1.0-draft  
**Status:** Modular Foundation — Implementation Deferred

Dual-mode (on/offline) AI system with:

- Persistent, portable memory independent of any single chat thread
- Controlled mutagenic / emergent idea accumulation
- Double-audit + pre-creation testing
- Dual-read artifacts (human-readable + machine-readable)
- Offline-first with graceful online enrichment
- Tlalli-Keeton Entity as Mutagenic Custodian

## Quick Links

- [Full Architecture](01-overview/ARCHITECTURE.md)
- Cloudflare Workers deployment target (coming)
- App shell (Presentation Layer)

## Core Principles

1. Nothing valuable is ever scrapped — mutagenic accumulation
2. Double audit before creation — structural + stability
3. Portable dual-read artifacts
4. Offline-first with graceful online enrichment
5. Baseline preservation — non-override protocol
6. Receipt as contract

## Structure

```
01-overview/     → Architecture + system context
02-schemas/      → JSON Schemas for all core objects
03-modules/      → Individual module specifications
04-safety/       → Audit, risk gates, test protocols
05-entity/       → Tlalli-Keeton definition & behavior
06-integration/  → How layers connect + extension points
app/             → Presentation / UI Layer (Cloudflare + mobile/web)
```

## Cloudflare Deployment

This repo is designed to deploy to Cloudflare Workers + Durable Objects + D1 / Vectorize for the online path, while remaining fully functional offline via embedded SLM + local SQLite-vec + image metadata.

See `06-integration/` (forthcoming) for the exact binding contracts.
