import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { SENTISENSE_DATASETS } from "../lib/sentisense-api.ts";
class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
function harness({
  authenticated = true,
  enabled = true,
  allowed = true,
  allowance = true,
} = {}) {
  const calls = [];
  const ast = ts.createSourceFile(
    "route.ts",
    fs.readFileSync("app/api/intelligence/[symbol]/route.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const body = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace(/^export /, ""))
    .join("\n");
  const code = ts.transpileModule(body, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  const bindings = {
    HttpError,
    SENTISENSE_DATASETS,
    account: async () => {
      calls.push("auth");
      if (!authenticated) throw new HttpError("Sign in", 401);
      return { user: { id: "member" } };
    },
    limit: async () => {
      calls.push("limit");
    },
    requestAccess: async () => ({
      enabled,
      owner: false,
      preview: false,
      features: Object.fromEntries(
        [
          "analysts",
          "news",
          "advanced",
          "options",
          "financials",
          "business",
        ].map((k) => [k, allowed]),
      ),
    }),
    reserveAccess: async () => {
      calls.push("allowance");
      if (!allowance) throw new HttpError("Allowance", 403);
    },
    researchSymbol: (s) => s,
    sentisenseRead: async (symbol, dataset) => {
      calls.push("provider");
      return { symbol, dataset, status: "no-coverage" };
    },
    privateJson: (v) =>
      Response.json(v, { headers: { "Cache-Control": "private, no-store" } }),
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 503 }),
  };
  return {
    calls,
    get: new Function(...Object.keys(bindings), code + "; return GET;")(
      ...Object.values(bindings),
    ),
  };
}
const request = (dataset) =>
  new Request(`https://example.test/api/intelligence/AAPL?dataset=${dataset}`);
const params = { params: Promise.resolve({ symbol: "AAPL" }) };
test("intelligence rejects unauthenticated, locked and exhausted callers before provider", async () => {
  for (const config of [
    { authenticated: false },
    { allowed: false },
    { allowance: false },
  ]) {
    const h = harness(config);
    const r = await h.get(request("consensus"), params);
    assert.ok(r.status >= 400);
    assert.ok(!h.calls.includes("provider"));
  }
});
test("intelligence rejects arbitrary endpoint names without provider access", async () => {
  const h = harness();
  assert.equal((await h.get(request("arbitrary"), params)).status, 400);
  assert.ok(!h.calls.includes("provider"));
});
test("intelligence accounts and limits each fixed section and keeps response private", async () => {
  for (const dataset of SENTISENSE_DATASETS) {
    const h = harness();
    const r = await h.get(request(dataset), params);
    assert.equal(r.status, 200);
    assert.deepEqual(h.calls, ["auth", "limit", "allowance", "provider"]);
    assert.match(r.headers.get("Cache-Control"), /no-store/);
    assert.equal((await r.json()).dataset, dataset);
  }
});
test("legacy Twelve network adapter has no endpoint or credentials", () => {
  const source = fs.readFileSync("lib/providers.ts", "utf8");
  const body = source.slice(
    source.indexOf("export async function twelve("),
    source.indexOf("const num = numeric"),
  );
  assert.doesNotMatch(body, /fetch\(|api\.twelvedata|TWELVE_DATA_API_KEY/);
  assert.match(body, /throw new HttpError/);
  assert.doesNotMatch(
    fs.readFileSync("lib/company-profiles.ts", "utf8"),
    /twelve\(/,
  );
});

test("research integrations cannot contact unrequested financial vendors", () => {
  for (const file of [
    "lib/company-profiles.ts",
    "lib/enrichment.ts",
    "lib/alpaca-options.ts",
    "lib/options-flow-source.ts",
  ]) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /fetch\(|FINNHUB_API_KEY|ALPACA_PAPER_API_KEY/);
  }
  const source = fs.readFileSync("lib/providers.ts", "utf8");
  const sec = source.slice(
    source.indexOf("async function sec("),
    source.indexOf("export async function fundamentals("),
  );
  assert.match(sec, /throw new HttpError/);
  assert.doesNotMatch(sec, /fetch\(|json\(/);
  const fundamentals = source.slice(
    source.indexOf("export async function fundamentals("),
    source.indexOf("async function secFundamentals("),
  );
  assert.match(fundamentals, /return eodFundamentals/);
  assert.doesNotMatch(fundamentals, /await secFundamentals/);
});
