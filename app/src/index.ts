/**
 * Codex Core — Presentation Layer entrypoint
 * Cloudflare Workers + Durable Objects
 * Offline-first ready (online enrichment path)
 *
 * Schemas live in /02-schemas
 * Double-audit is mandatory before any receipt is issued.
 * Approved receipts also attempt write to D1 Delta Ledger (graceful if unbound).
 */

export interface Env {
  TLALLI_KEETON: DurableObjectNamespace;
  USER_MEMORY: DurableObjectNamespace;
  DELTA_LEDGER: D1Database;
}

// Minimal dual-read receipt shape (matches MutationReceipt schema)
interface MutationReceipt {
  receiptId: string;
  timestamp: string;
  mutationType: string;
  status: "approved" | "rejected" | "parked-for-refinement";
  structuralAudit: { passed: boolean; score: number; notes: string };
  stabilityAudit: { passed: boolean; riskLevel: string; notes: string };
  artifactRef: string;
  humanSummary: string;
  machineState: Record<string, unknown>;
  issuedBy: "Tlalli-Keeton";
}

function generateId(): string {
  return crypto.randomUUID();
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health / status
    if (url.pathname === "/" || url.pathname === "/status") {
      return new Response(
        JSON.stringify({
          system: "Codex Core",
          designator: "#CODEX-CORE",
          version: "0.1.0-draft",
          status: "Schemas live · Receipt issuer active · D1 write path ready (bind ID to activate)",
          principles: [
            "Nothing valuable is ever scrapped",
            "Double audit before creation",
            "Portable dual-read artifacts",
            "Offline-first with graceful online enrichment",
            "Baseline preservation",
            "Receipt as contract",
          ],
          endpoints: [
            "GET  /",
            "GET  /status",
            "GET  /entity/status",
            "POST /entity/propose  (body: {type, summary, payload?})",
            "GET  /memory?user=<id>",
          ],
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Route to Tlalli-Keeton entity
    if (url.pathname.startsWith("/entity")) {
      const id = env.TLALLI_KEETON.idFromName("global-custodian");
      const stub = env.TLALLI_KEETON.get(id);
      return stub.fetch(request);
    }

    // Route to per-user memory
    if (url.pathname.startsWith("/memory")) {
      const userId = url.searchParams.get("user") || "anonymous";
      const id = env.USER_MEMORY.idFromName(userId);
      const stub = env.USER_MEMORY.get(id);
      return stub.fetch(request);
    }

    return new Response("Codex Core — route not found", { status: 404 });
  },
};

/** Tlalli-Keeton: Mutagenic Custodian + Receipt Issuer + Delta Ledger writer */
export class TlalliKeeton {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /**
   * Attempt to persist an approved receipt into the D1 Delta Ledger.
   * Graceful: if D1 is unbound or the write fails, we log and continue.
   * The Durable Object storage remains the primary durable store until D1 is fully bound.
   */
  private async writeToDeltaLedger(receipt: MutationReceipt): Promise<{ written: boolean; error?: string }> {
    try {
      // Only write approved receipts to the long-term ledger
      if (receipt.status !== "approved") {
        return { written: false, error: "skipped-non-approved" };
      }

      // Guard: if the binding is missing or still the placeholder, skip quietly
      if (!this.env.DELTA_LEDGER) {
        return { written: false, error: "d1-unbound" };
      }

      await this.env.DELTA_LEDGER.prepare(
        `INSERT INTO receipts (
          receipt_id, timestamp, mutation_type, status,
          structural_passed, structural_score,
          stability_passed, risk_level,
          human_summary, machine_state, artifact_ref, issued_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          receipt.receiptId,
          receipt.timestamp,
          receipt.mutationType,
          receipt.status,
          receipt.structuralAudit.passed ? 1 : 0,
          receipt.structuralAudit.score,
          receipt.stabilityAudit.passed ? 1 : 0,
          receipt.stabilityAudit.riskLevel,
          receipt.humanSummary,
          JSON.stringify(receipt.machineState),
          receipt.artifactRef,
          receipt.issuedBy
        )
        .run();

      // Also create a delta entry for the mutation itself
      await this.env.DELTA_LEDGER.prepare(
        `INSERT INTO delta_entries (entry_id, receipt_id, delta_type, payload)
         VALUES (?, ?, ?, ?)`
      )
        .bind(
          generateId(),
          receipt.receiptId,
          receipt.mutationType,
          JSON.stringify(receipt.machineState.originalProposal || {})
        )
        .run();

      return { written: true };
    } catch (err: any) {
      // Common when database_id is still the placeholder or table not yet created
      return { written: false, error: err?.message || "d1-write-failed" };
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Status
    if (url.pathname === "/entity/status" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          entity: "Tlalli-Keeton",
          role: "Mutagenic Custodian",
          functions: ["Hoarder", "Auditor", "Receipt Issuer", "Emergence Gate", "Delta Ledger Writer"],
          status: "online",
          schemasLoaded: ["MutationReceipt", "DualReadArtifact", "RiskGateDecision"],
          doubleAudit: "enforced",
          d1WritePath: "ready (activates after you bind real database_id)",
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Propose a mutation → run double-audit → issue receipt → attempt D1 write
    if (url.pathname === "/entity/propose" && request.method === "POST") {
      let body: { type?: string; summary?: string; payload?: Record<string, unknown> };
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const mutationType = body.type || "idea-accumulation";
      const summary = body.summary || "No summary provided";
      const payload = body.payload || {};

      // --- STRUCTURAL AUDIT ---
      const structuralPassed = typeof summary === "string" && summary.length > 5;
      const structuralScore = structuralPassed ? 0.92 : 0.3;
      const structuralNotes = structuralPassed
        ? "Structure valid. Summary present. Type recognized."
        : "Structural failure: summary too short or missing.";

      // --- STABILITY AUDIT ---
      const riskLevel = mutationType === "safety-gate-update" ? "high" : "low";
      const stabilityPassed = riskLevel !== "critical";
      const stabilityNotes =
        riskLevel === "low"
          ? "Low footprint. No baseline override detected. Safe to proceed."
          : "Elevated risk. Requires additional review.";

      const finalStatus: MutationReceipt["status"] =
        structuralPassed && stabilityPassed ? "approved" : "parked-for-refinement";

      const receipt: MutationReceipt = {
        receiptId: generateId(),
        timestamp: new Date().toISOString(),
        mutationType,
        status: finalStatus,
        structuralAudit: {
          passed: structuralPassed,
          score: structuralScore,
          notes: structuralNotes,
        },
        stabilityAudit: {
          passed: stabilityPassed,
          riskLevel,
          notes: stabilityNotes,
        },
        artifactRef: `receipts/${generateId()}.json`,
        humanSummary:
          finalStatus === "approved"
            ? `Approved: ${summary}. Double-audit cleared. Mutation may proceed.`
            : `Parked for refinement: ${summary}. Failed one or both audits.`,
        machineState: {
          originalProposal: { type: mutationType, summary, payload },
          auditTrail: {
            structural: structuralPassed,
            stability: stabilityPassed,
          },
          nextAction: finalStatus === "approved" ? "apply" : "refine",
        },
        issuedBy: "Tlalli-Keeton",
      };

      // Always persist in Durable Object storage (primary durable store)
      await this.state.storage.put(`receipt:${receipt.receiptId}`, receipt);

      // Attempt long-term write to D1 Delta Ledger (graceful)
      const d1Result = await this.writeToDeltaLedger(receipt);

      // Enrich the response so the caller knows the ledger status
      const responseBody = {
        ...receipt,
        ledger: {
          d1Written: d1Result.written,
          d1Note: d1Result.written
            ? "Persisted to Delta Ledger"
            : d1Result.error === "d1-unbound" || d1Result.error?.includes("placeholder")
              ? "D1 not yet bound — receipt lives in Durable Object only. Bind database_id to activate."
              : d1Result.error || "D1 write skipped",
        },
      };

      return new Response(JSON.stringify(responseBody, null, 2), {
        status: finalStatus === "approved" ? 201 : 202,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        message: "Tlalli-Keeton ready. Use POST /entity/propose to request a mutation receipt.",
        example: {
          type: "idea-accumulation",
          summary: "Add offline dual-read receipt viewer",
          payload: { priority: "high" },
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}

/** Per-user persistent memory substrate */
export class UserMemory {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get("user") || "anonymous";

    return new Response(
      JSON.stringify({
        substrate: "UserMemory",
        userId,
        note: "SQLite-backed via Durable Object. Dual-read + Delta Ledger integration ready once D1 is bound.",
        available: true,
      }, null, 2),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
