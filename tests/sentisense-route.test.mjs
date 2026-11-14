import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { projectResearch } from "../lib/access-policy.ts";
const input = () => ({
  company: { symbol: "IREN", assetType: "stock", currency: "USD" },
  quote: { price: 21, currency: "USD" },
  retrievedAt: "2026-11-14T00:00:00Z",
  history: [],
  facts: [],
  filings: [],
  issues: [],
  evidence: {
    source: "EODHD",
    updatedAt: "2026-11-13",
    consensus: { target: 40 },
  },
});
function route({ owner = true, broken = false } = {}) {
  const original = input();
  let enrichmentCalls = 0;
  let imported = 0;
  const bindings = {
    "@/lib/access-server": {
      requestAccess: async () => ({ owner, enabled: false }),
      reserveAccess: async () => {},
    },
    "@/lib/access-policy": { projectResearch },
    "@/lib/canonical": { canonical: () => ({ id: "existing-snapshot" }) },
    "@/lib/server": {
      account: async () => ({ user: { id: "signed-in-owner" } }),
      limit: async () => {},
      privateJson: Response.json,
      failure: () => Response.json({ error: "failed" }, { status: 503 }),
    },
    "@/lib/providers": {
      research: async () => original,
      researchSymbol: (x) => x,
    },
    "@/lib/sentisense-provider": {
      enrichSentiSenseTargets: async (r, access) => {
        enrichmentCalls++;
        assert.equal(access.owner, true);
        if (broken) throw Error("unavailable optional module");
        return { ...r, analystTargets: { source: "SentiSense" } };
      },
    },
  };
  const code = ts.transpileModule(
    fs.readFileSync("app/api/research/[symbol]/route.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => {
      assert.ok(name in bindings, name);
      if (name === "@/lib/sentisense-provider") imported++;
      return bindings[name];
    },
    mod,
    mod.exports,
  );
  return {
    original,
    run: () =>
      mod.exports.GET(
        new Request("https://preview.invalid/api/research/IREN"),
        { params: Promise.resolve({ symbol: "IREN" }) },
      ),
    counts: () => ({ enrichmentCalls, imported }),
  };
}
function enabled(t, value) {
  const previous = process.env.AURYN_SENTISENSE_PREVIEW_ENABLED;
  process.env.AURYN_SENTISENSE_PREVIEW_ENABLED = value;
  t.after(() => {
    if (previous === undefined)
      delete process.env.AURYN_SENTISENSE_PREVIEW_ENABLED;
    else process.env.AURYN_SENTISENSE_PREVIEW_ENABLED = previous;
  });
}
test("the research route never loads optional target transport unless explicitly enabled for an authenticated owner", async (t) => {
  enabled(t, "false");
  const disabled = route();
  assert.equal((await disabled.run()).status, 200);
  assert.equal(disabled.counts().imported, 0);
  process.env.AURYN_SENTISENSE_PREVIEW_ENABLED = "true";
  const nonowner = route({ owner: false });
  assert.equal((await nonowner.run()).status, 200);
  assert.equal(nonowner.counts().imported, 0);
  const owner = route();
  const result = await (await owner.run()).json();
  assert.equal(result.analystTargets.source, "SentiSense");
  assert.equal(owner.counts().enrichmentCalls, 1);
  assert.deepEqual(result.evidence, owner.original.evidence);
});
test("an unexpected optional enrichment error cannot replace an otherwise valid research response with an outage", async (t) => {
  enabled(t, "true");
  const f = route({ broken: true });
  const response = await f.run();
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.evidence, f.original.evidence);
  assert.equal(result.analystTargets, undefined);
});
