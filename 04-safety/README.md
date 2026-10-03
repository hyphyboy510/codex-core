# 04-safety

Audit, risk gates, test protocols.

## Double-Audit Enforcement

Every mutation proposal that hits `POST /entity/propose` is subjected to:

1. **Structural Audit** — shape, required fields, type recognition
2. **Stability Audit** — risk level, baseline non-override, footprint

Only when both pass does Tlalli-Keeton issue an `approved` MutationReceipt.
Otherwise the proposal is `parked-for-refinement` (never discarded).

See the live implementation in `app/src/index.ts` and the contracts in `02-schemas/`.
