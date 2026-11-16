import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {
  canReadAnalystTargets,
  mergeIndependentTargets,
} from "../lib/independent-analyst-targets.ts";
import { usableAnalystTargets } from "../lib/sentisense-targets.ts";
const now = Date.parse("2026-11-16T12:00:00Z");
const target = {
  symbol: "IREN",
  currency: "USD",
  source: "SentiSense",
  sourceField: "consensus.targetMean",
  timestampBasis: "dataset-refresh",
  updatedAt: "2026-11-15T12:00:00Z",
  low: 10,
  target: 20,
  high: 30,
  analysts: 5,
};
const base = {
  company: { symbol: "IREN", currency: "USD", assetType: "stock" },
  quote: { currency: "USD" },
  history: [],
  facts: [],
  evidence: { source: "existing" },
  retrievedAt: "old",
};
test("independent response only enriches matching valid targets, preserving financial and price identities", () => {
  const result = mergeIndependentTargets(
    base,
    { symbol: "IREN", enabled: true, targets: target },
    now,
  );
  assert.equal(result.analystTargets, target);
  for (const key of ["quote", "evidence", "history", "facts", "retrievedAt"])
    assert.equal(result[key], base[key]);
  for (const response of [
    null,
    { symbol: "APP", enabled: true, targets: target },
    { symbol: "IREN", enabled: false, targets: target },
    { symbol: "IREN", enabled: true, targets: null },
  ])
    assert.equal(mergeIndependentTargets(base, response, now), base);
  assert.equal(
    mergeIndependentTargets(
      base,
      {
        symbol: "IREN",
        enabled: true,
        targets: { ...target, updatedAt: "2020-01-01T00:00:00Z" },
      },
      now,
    ),
    base,
  );
});
test("late older responses cannot replace a newer observation", () => {
  const newest = {
    ...base,
    analystTargets: { ...target, updatedAt: "2026-11-16T10:00:00Z" },
  };
  assert.equal(
    mergeIndependentTargets(
      newest,
      { symbol: "IREN", enabled: true, targets: target },
      now,
    ),
    newest,
  );
});
function load({
  signedIn = true,
  access = { enabled: true, owner: false, features: { overview: true } },
  getTargets = async () => target,
  mode = "pro",
  host = "preview",
} = {}) {
  let calls = 0;
  const deps = {
    "@/lib/server": {
      account: async () => {
        if (!signedIn) throw Object.assign(Error("auth"), { status: 401 });
        return { user: { id: "u" } };
      },
      limit: async () => {},
      privateJson: Response.json,
      failure: (e) =>
        Response.json({ error: e.message }, { status: e.status || 500 }),
      HttpError: class extends Error {
        constructor(m, status = 400) {
          super(m);
          this.status = status;
        }
      },
    },
    "@/lib/access-server": { requestAccess: async () => access },
    "@/lib/providers": { researchSymbol: (x) => x },
    "@/lib/independent-analyst-targets": { canReadAnalystTargets },
    "@/lib/sentisense-targets": {
      usableAnalystTargets: (v, s, c) => usableAnalystTargets(v, s, c, now),
    },
    "@/lib/sentisense-provider": {
      getSentiSenseTargets: async (...args) => {
        calls++;
        return getTargets(...args);
      },
    },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync("app/api/analyst-targets/[symbol]/route.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  new Function("require", "module", "exports", "process", code)(
    (n) => {
      assert.ok(deps[n], n);
      return deps[n];
    },
    mod,
    mod.exports,
    { env: { AURYN_SENTISENSE_MODE: mode, VERCEL_ENV: host } },
  );
  return {
    call: () =>
      mod.exports.GET(new Request("https://test"), {
        params: Promise.resolve({ symbol: "IREN" }),
      }),
    calls: () => calls,
  };
}
test("endpoint protects authentication, features, pro mode and hosted deployment without fetching", async () => {
  for (const config of [
    { signedIn: false },
    { access: { enabled: true, owner: false, features: {} } },
    { mode: "preview" },
    { host: "development" },
  ]) {
    const route = load(config);
    await route.call();
    assert.equal(route.calls(), 0);
  }
  const route = load();
  const response = await route.call();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).targets.symbol, "IREN");
});
test("slow independent targets remain pending without waiting on or mutating base research", async () => {
  let finish;
  const route = load({ getTargets: () => new Promise((r) => (finish = r)) });
  let done = false;
  const pending = route.call().then((r) => {
    done = true;
    return r;
  });
  await new Promise((r) => setImmediate(r));
  assert.equal(done, false);
  assert.equal(base.evidence.source, "existing");
  finish(target);
  assert.equal((await pending).status, 200);
  const source = fs.readFileSync("components/Research.tsx", "utf8");
  assert.match(source, /analyst-targets/);
  assert.match(source, /mergeIndependentTargets/);
  assert.match(source, /analystResource.refresh\(\)/);
  assert.match(source, /rawResearch = resource.data/);
});
