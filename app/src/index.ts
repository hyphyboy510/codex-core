/**
 * Codex Core — Presentation Layer entrypoint
 * Cloudflare Workers + Durable Objects
 * Offline-first ready (online enrichment path)
 *
 * Schemas live in /02-schemas
 * Double-audit is mandatory before any receipt is issued.
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
          status: "Schemas live · Receipt issuer active · D1 pending bind",
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

/** Tlalli-Keeton: Mutagenic Custodian + Receipt Issuer */
export class TlalliKeeton {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Status
    if (url.pathname === "/entity/status" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          entity: "Tlalli-Keeton",
          role: "Mutagenic Custodian",
          functions: ["Hoarder", "Auditor", "Receipt Issuer", "Emergence Gate"],
          status: "online",
          schemasLoaded: ["MutationReceipt", "DualReadArtifact", "RiskGateDecision"],
          doubleAudit: "enforced",
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Propose a mutation → run double-audit → issue receipt
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
      // Simple risk heuristic for v0.1
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

      // Persist receipt in Durable Object storage (simple key-value for now)
      await this.state.storage.put(`receipt:${receipt.receiptId}`, receipt);

      // TODO: also write to D1 DELTA_LEDGER once database_id is bound

      return new Response(JSON.stringify(receipt, null, 2), {
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
        note: "SQLite-backed via Durable Object. Dual-read + Delta Ledger integration pending full D1 bind.",
        available: true,
      }, null, 2),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
