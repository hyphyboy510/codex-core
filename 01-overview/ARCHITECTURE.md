# Codex Architecture — Full System Design
**Version:** 0.1.0-draft  
**Designator:** #CODEX-CORE  
**Status:** Modular Foundation — Implementation Deferred  
**Last Scan:** 2026-09-29T23:05:00Z

---

## Purpose

This document set defines the complete architecture for a dual-mode (on/offline) AI system that:

- Maintains persistent, portable memory independent of any single chat thread
- Supports controlled mutagenic / emergent idea accumulation
- Enforces double-audit + pre-creation testing before any mutation is applied
- Preserves baseline integrity (non-override protocol)
- Produces clean, dual-read artifacts (human-readable + machine-readable)

The goal is to get the structure right the first time so later implementation does not require re-architecture.

---

## High-Level Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation / UI Layer                  │
│         (Mobile App · Web · Receipt Viewer · Codex UI)      │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                     Local Smart Router                      │
│     (Network · Battery · Complexity · Risk Gate checks)     │
└────────────┬───────────────────────────────┬────────────────┘
             │                               │
   ┌─────────▼─────────┐           ┌─────────▼─────────┐
   │  Embedded SLM     │           │  Cloud / API      │
   │  Engine (Offline) │           │  Engine (Online)  │
   └─────────┬─────────┘           └─────────┬─────────┘
             │                               │
             └────────────┬──────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              Persistent Memory Substrate                    │
│  Image Metadata · KV-Cache · SQLite-vec · Delta Ledger      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│         Tlalli-Keeton Entity (Mutagenic Custodian)          │
│   Hoarder · Auditor · Receipt Issuer · Emergence Gate       │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Design Principles

1. **Nothing valuable is ever scrapped** — mutagenic accumulation
2. **Double audit before creation** — structural + stability
3. **Portable dual-read artifacts** — human sees form, system sees state
4. **Offline-first with graceful online enrichment**
5. **Baseline preservation** — non-override of core protocols and personal memory
6. **Receipt as contract** — every approved mutation produces a verifiable receipt

---

## Document Map

| Part | Path | Contents |
|------|------|----------|
| 01 | `01-overview/` | This file + system context |
| 02 | `02-schemas/` | JSON Schemas for all core objects |
| 03 | `03-modules/` | Individual module specifications |
| 04 | `04-safety/` | Audit, risk gates, test protocols |
| 05 | `05-entity/` | Tlalli-Keeton definition & behavior |
| 06 | `06-integration/` | How layers connect + future extension points |

---

## Deferred Complexity

All heavy implementation (actual model loading, real Monte Carlo runners, production image metadata writers, etc.) is explicitly deferred. These documents define only the contracts, data shapes, and decision logic so that when implementation begins, the shape is already correct.
