# 02-schemas

JSON Schemas for all core objects.

## Active Schemas

| Schema | File | Purpose |
|--------|------|--------|
| MutationReceipt | `MutationReceipt.json` | Verifiable dual-read receipt issued after double-audit |
| DualReadArtifact | `DualReadArtifact.json` | Portable human + machine readable artifact |
| RiskGateDecision | `RiskGateDecision.json` | Output of structural + stability audit |

All schemas follow JSON Schema Draft 2020-12.

These contracts are the single source of truth for the Worker, Durable Objects, and future offline SLM path.
