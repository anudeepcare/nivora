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
function route({ owner = true, broken = false, signedIn = true, authorized = true, accessEnabled = false, features = {} } = {}) {
  const original = input();
  let enrichmentCalls = 0;
  let imported = 0;
  const bindings = {
    "@/lib/access-server": {
      requestAccess: async () => ({ owner, enabled: accessEnabled, features }),
      reserveAccess: async () => { if (!authorized) throw Error("Not authorized"); },
    },
    "@/lib/access-policy": { projectResearch },
    "@/lib/canonical": { canonical: () => ({ id: "existing-snapshot" }) },
    "@/lib/server": {
      account: async () => { if (!signedIn) throw Error("Sign in"); return { user: { id: "signed-in-user" } }; },
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
        assert.equal(access.authenticated, true);
        assert.equal(access.owner, owner);
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

function proMode(t, environment = "preview") {
  for (const [key, value] of Object.entries({ AURYN_SENTISENSE_MODE: "pro", VERCEL_ENV: environment })) {
    const old = process.env[key]; process.env[key] = value;
    t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old; });
  }
  enabled(t, "false");
}
test("paid base research never waits for target enrichment and preserves primary evidence", async t => {
  proMode(t); const f = route({owner:false});
  const result = await (await f.run()).json();
  assert.equal(f.counts().enrichmentCalls, 0);
  assert.equal(result.analystTargets, undefined);
  assert.deepEqual(result.evidence, f.original.evidence);
});
test("paid base research remains independent in production and outside hosted environments", async t => {
  proMode(t, "production");
  const f = route({owner:false}); await f.run(); assert.equal(f.counts().enrichmentCalls, 0);
  delete process.env.AURYN_SENTISENSE_MODE;
  const disabled = route({owner:false}); await disabled.run(); assert.equal(disabled.counts().imported, 0);
  process.env.AURYN_SENTISENSE_MODE = "pro";
  delete process.env.VERCEL_ENV;
  const local = route({owner:false}); await local.run(); assert.equal(local.counts().imported, 0);
});
test("paid enrichment cannot bypass authentication or existing access reservation", async t => {
  proMode(t);
  for (const options of [{signedIn:false}, {authorized:false}]) {
    const f = route(options); assert.equal((await f.run()).status, 503);
    assert.equal(f.counts().imported, 0);
  }
});

test("paid base route preserves feature restrictions and leaves shared base research unmodified", async t => {
  proMode(t);
  const locked = route({owner:false, accessEnabled:true, features:{}});
  const hidden = await (await locked.run()).json();
  assert.equal(hidden.analystTargets, undefined);
  assert.equal(hidden.snapshot, undefined);
  assert.equal(locked.original.analystTargets, undefined);
  const visible = route({owner:false, accessEnabled:true, features:{value:true}});
  const result = await (await visible.run()).json();
  assert.equal(result.analystTargets, undefined);
  assert.equal(visible.counts().imported, 0);
  assert.equal(visible.original.analystTargets, undefined);
});
test("unrecognized paid mode never widens a nonowner projection", async t => {
  proMode(t); process.env.AURYN_SENTISENSE_MODE = "PRO";
  const f = route({owner:false});
  const result = await (await f.run()).json();
  assert.equal(f.counts().imported, 0);
  assert.equal(result.analystTargets, undefined);
});
