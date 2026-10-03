-- Codex Core — Delta Ledger schema (D1)
-- Run after creating the database:
-- npx wrangler d1 execute codex-delta-ledger --file=./d1-schema.sql

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  mutation_type TEXT NOT NULL,
  status TEXT NOT NULL,
  structural_passed INTEGER NOT NULL,
  structural_score REAL,
  stability_passed INTEGER NOT NULL,
  risk_level TEXT,
  human_summary TEXT,
  machine_state TEXT,          -- JSON
  artifact_ref TEXT,
  issued_by TEXT DEFAULT 'Tlalli-Keeton',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_type ON receipts(mutation_type);
CREATE INDEX IF NOT EXISTS idx_receipts_timestamp ON receipts(timestamp);

CREATE TABLE IF NOT EXISTS delta_entries (
  entry_id TEXT PRIMARY KEY,
  receipt_id TEXT REFERENCES receipts(receipt_id),
  delta_type TEXT NOT NULL,
  payload TEXT,                -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);
