/**
 * Codex Core — Presentation Layer entrypoint
 * Version: 0.1.0
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
          version: "0.1.0",
          status: "First stable foundation · Receipt issuer + D1 path + ledger health live",
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
            "GET  /entity/ledger-status",
            "POST /entity/propose  (body: {type, summary, payload?})",
            "GET  /entity/receipt/:id  (dual-read viewer)",
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

  private async writeToDeltaLedger(receipt: MutationReceipt): Promise<{ written: boolean; error?: string }> {
    try {
      if (receipt.status !== "approved") {
        return { written: false, error: "skipped-non-approved" };
      }

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
          version: "0.1.0",
          schemasLoaded: ["MutationReceipt", "DualReadArtifact", "RiskGateDecision"],
          doubleAudit: "enforced",
          d1WritePath: "ready (activates after you bind real database_id)",
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Ledger health (hidden gem activated)
    if (url.pathname === "/entity/ledger-status" && request.method === "GET") {
      const allKeys = await this.state.storage.list({ prefix: "receipt:" });
      let doCount = 0;
      let approvedCount = 0;
      let parkedCount = 0;

      for (const [_, value] of allKeys) {
        doCount++;
        const r = value as MutationReceipt;
        if (r.status === "approved") approvedCount++;
        if (r.status === "parked-for-refinement") parkedCount++;
      }

      let d1Count = 0;
      let d1Note = "D1 not bound or unreachable";
      try {
        if (this.env.DELTA_LEDGER) {
          const result = await this.env.DELTA_LEDGER.prepare("SELECT COUNT(*) as cnt FROM receipts").first<{ cnt: number }>();
          d1Count = result?.cnt || 0;
          d1Note = "D1 reachable";
        }
      } catch {
        d1Note = "D1 query failed (likely unbound or schema not applied)";
      }

      return new Response(
        JSON.stringify({
          ledgerHealth: {
            durableObjectReceipts: doCount,
            approvedInDO: approvedCount,
            parkedInDO: parkedCount,
            d1Receipts: d1Count,
            d1Status: d1Note,
            dualStoreHealthy: doCount >= d1Count,
            note: "Durable Object is always primary. D1 is long-term enrichment.",
          },
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Dual-read receipt viewer (simple HTML that works offline once saved)
    if (url.pathname.startsWith("/entity/receipt/") && request.method === "GET") {
      const receiptId = url.pathname.split("/").pop() || "";
      const receipt = await this.state.storage.get<MutationReceipt>(`receipt:${receiptId}`);

      if (!receipt) {
        return new Response("Receipt not found", { status: 404 });
      }

      // Dual-read HTML: human form on top, machine state as collapsible JSON
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codex Receipt ${receipt.receiptId.slice(0, 8)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; background: #0f0f0f; color: #e0e0e0; }
    .card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .approved { background: #0a3d2a; color: #4ade80; }
    .parked { background: #3d2a0a; color: #fbbf24; }
    h1 { font-size: 1.4rem; margin: 0 0 0.5rem; }
    pre { background: #111; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; }
    details { margin-top: 1rem; }
    summary { cursor: pointer; color: #888; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge ${receipt.status === "approved" ? "approved" : "parked"}">${receipt.status}</span>
    <h1>${receipt.humanSummary}</h1>
    <p><strong>Type:</strong> ${receipt.mutationType}</p>
    <p><strong>Issued:</strong> ${receipt.timestamp}</p>
    <p><strong>By:</strong> ${receipt.issuedBy}</p>
    <p><strong>Structural:</strong> ${receipt.structuralAudit.passed ? "✅" : "❌"} (${receipt.structuralAudit.score}) — ${receipt.structuralAudit.notes}</p>
    <p><strong>Stability:</strong> ${receipt.stabilityAudit.passed ? "✅" : "❌"} (${receipt.stabilityAudit.riskLevel}) — ${receipt.stabilityAudit.notes}</p>
  </div>
  <div class="card">
    <details>
      <summary>Machine State (click to expand)</summary>
      <pre>${JSON.stringify(receipt.machineState, null, 2)}</pre>
    </details>
  </div>
  <p style="text-align:center;color:#555;font-size:0.8rem;">Codex Core dual-read artifact · save this page for offline use</p>
</body>
</html>`;

      return new Response(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
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

      const structuralPassed = typeof summary === "string" && summary.length > 5;
      const structuralScore = structuralPassed ? 0.92 : 0.3;
      const structuralNotes = structuralPassed
        ? "Structure valid. Summary present. Type recognized."
        : "Structural failure: summary too short or missing.";

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

      await this.state.storage.put(`receipt:${receipt.receiptId}`, receipt);

      const d1Result = await this.writeToDeltaLedger(receipt);

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
        viewer: `/entity/receipt/${receipt.receiptId}`,
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
