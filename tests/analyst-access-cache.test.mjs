import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createHash } from "node:crypto";

test("a cached public analyst report still requires the current account AI entitlement", async () => {
  let authorized = true,
    reservations = 0,
    requests = 0;
  class HttpError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }
  const bindings = {
    "@/lib/ai-provider-request": {
      aiProviderRequest: async () => {
        requests++;
        return {
          model: "test",
          response: Response.json({
            status: "completed",
            output: [
              {
                type: "message",
                content: [{ type: "output_text", text: "{}" }],
              },
            ],
          }),
        };
      },
    },
    "@/lib/access-server": {
      requestAccess: async () => ({ authorized }),
      requireFeature: (access, feature) => {
        assert.equal(feature, "ai");
        if (!access.authorized)
          throw new HttpError("AI entitlement required", 403);
      },
      reserveAccess: async () => {
        reservations++;
      },
    },
    "@/lib/filing-passages": { filingPassages: async () => [] },
    "@/lib/connected-product": { analysisIntent: (x) => x },
    "node:crypto": { createHash },
    "@/lib/server": {
      account: async () => ({
        user: {
          id: "test-account",
          is_anonymous: false,
          email_confirmed_at: "2026-01-01",
        },
        db: { rpc: async () => ({ data: true }) },
      }),
      failure: (e) =>
        Response.json({ error: e.message }, { status: e.status ?? 500 }),
      HttpError,
      limit: async () => {},
      privateJson: (value) => Response.json(value),
    },
    "@/lib/providers": {
      research: async () => ({ company: { symbol: "TEST" } }),
    },
    "@/lib/format": { symbolInput: (x) => x },
    "@/lib/analyst-status": { analystStatus: () => ({ available: true }) },
    "@/lib/report": {
      evidenceFor: () =>
        Array.from({ length: 6 }, (_, i) => ({ id: `fact-${i}` })),
      reportSchema: {},
      validateReport: (x) => x,
    },
  };
  const code = ts.transpileModule(
    fs.readFileSync("app/api/analyst/[symbol]/route.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", "process", code)(
    (name) => {
      assert.ok(name in bindings, name);
      return bindings[name];
    },
    module,
    module.exports,
    { env: { OPENAI_API_KEY: "test", OPENAI_MODEL: "test" } },
  );
  const request = () =>
    new Request("https://example.test/api/analyst/TEST", {
      method: "POST",
      body: JSON.stringify({ mode: "snapshot" }),
    });
  const context = { params: Promise.resolve({ symbol: "TEST" }) };
  assert.equal((await module.exports.POST(request(), context)).status, 200);
  assert.equal((await module.exports.POST(request(), context)).status, 200);
  assert.equal(requests, 1);
  assert.equal(reservations, 1, "cache hits do not reserve another generation");
  authorized = false;
  assert.equal((await module.exports.POST(request(), context)).status, 403);
  assert.equal(requests, 1);
  assert.equal(reservations, 1);
});
