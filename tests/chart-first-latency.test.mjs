import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createProviderCache } from "../lib/provider-cache.ts";
const source = fs.readFileSync("app/api/chart/[symbol]/route.ts", "utf8");
function route({
  access = { enabled: false, features: {} },
  history,
  authenticated = true,
}) {
  const deps = {
    "@/lib/access-server": { requestAccess: async () => access },
    "@/lib/providers": { marketHistory: history, researchSymbol: (x) => x },
    "@/lib/server": {
      account: async () => {
        if (!authenticated) throw Error();
        return { user: { id: "u" } };
      },
      limit: async () => {},
      privateJson: Response.json,
      failure: () => Response.json({}, { status: 401 }),
      HttpError: Error,
    },
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function("require", "module", "exports", code)(
    (n) => {
      assert.ok(deps[n], n);
      return deps[n];
    },
    mod,
    mod.exports,
  );
  return () =>
    mod.exports.GET(new Request("https://test/api/chart/IREN?range=5Y"), {
      params: Promise.resolve({ symbol: "IREN" }),
    });
}
test("chart responds while the independent fundamentals promise remains unresolved", async () => {
  let release;
  let statementsDone = false;
  const statements = new Promise((r) => (release = r)).then(
    () => (statementsDone = true),
  );
  let releaseHistory;
  const pending = new Promise((r) => (releaseHistory = r));
  const read = route({ history: () => pending });
  const response = read();
  releaseHistory({
    candles: [{ time: "2026-11-13", close: 10 }],
    source: "dated observations",
  });
  const result = await response;
  assert.equal(result.status, 200);
  assert.equal(statementsDone, false);
  assert.equal((await result.json()).candles.length, 1);
  release();
  await statements;
  assert.doesNotMatch(source, /fundamentals|enrichSentiSense|canonical/);
});
test("early history retains research-equivalent access limits", async () => {
  const candles = Array.from({ length: 1000 }, (_, i) => ({
    time: String(i),
    close: i,
  }));
  for (const [features, length] of [
    [{}, 252],
    [{ technicals: true }, 756],
    [{ longHistory: true }, 1000],
  ]) {
    const response = await route({
      access: { enabled: true, owner: false, features },
      history: async () => ({ candles }),
    })();
    assert.equal((await response.json()).candles.length, length);
  }
  let calls = 0;
  await route({
    authenticated: false,
    history: async () => {
      calls++;
      return { candles };
    },
  })();
  assert.equal(calls, 0);
});
test("same history cache key shares in-flight work between base and early request", async () => {
  const cache = createProviderCache();
  let calls = 0,
    release;
  const upstream = () => {
    calls++;
    return new Promise((r) => (release = r));
  };
  const base = cache("selected-history:eodhd:IREN:5Y", 900000, upstream);
  const early = cache("selected-history:eodhd:IREN:5Y", 900000, upstream);
  await Promise.resolve();
  assert.equal(calls, 1);
  release({ candles: [] });
  assert.equal(await base, await early);
});
test("loading surface displays real history without constructing synthetic company research", () => {
  const s = fs.readFileSync("components/Research.tsx", "utf8");
  assert.match(s, /!demo && !baseResearch/);
  assert.match(s, /earlyHistory.data.candles/);
  assert.match(s, /Company research &amp; Pace are still loading/);
  assert.match(s, /PriceChart/);
  assert.match(s, /range=5Y/);
});
