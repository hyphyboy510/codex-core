/**
 * Codex Core — Presentation Layer entrypoint
 * Cloudflare Workers + Durable Objects
 * Offline-first ready (online enrichment path)
 */

export interface Env {
  TLALLI_KEETON: DurableObjectNamespace;
  USER_MEMORY: DurableObjectNamespace;
  DELTA_LEDGER: D1Database;
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
          status: "Modular Foundation — Online path active",
          principles: [
            "Nothing valuable is ever scrapped",
            "Double audit before creation",
            "Portable dual-read artifacts",
            "Offline-first with graceful online enrichment",
            "Baseline preservation",
            "Receipt as contract",
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

/** Tlalli-Keeton: Mutagenic Custodian */
export class TlalliKeeton {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/entity/status") {
      return new Response(
        JSON.stringify({
          entity: "Tlalli-Keeton",
          role: "Mutagenic Custodian",
          functions: ["Hoarder", "Auditor", "Receipt Issuer", "Emergence Gate"],
          status: "online",
        }, null, 2),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Placeholder for future mutation / audit endpoints
    return new Response(
      JSON.stringify({ message: "Tlalli-Keeton ready. Mutation gates locked until schemas land." }),
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
    return new Response(
      JSON.stringify({
        substrate: "UserMemory",
        note: "SQLite-backed via Durable Object. Dual-read + Delta Ledger integration pending.",
      }, null, 2),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
