import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {
  trackerIds,
  trackerCatalog,
  trackerSnapshot,
} from "../lib/market-trackers.ts";
const fixture = () => ({
  isPreview: true,
  totalCount: 4,
  data: {
    trackerId: "market-session",
    schemaVersion: "1.0",
    displayName: "Session",
    description: "Synthetic",
    viewType: "table",
    asOf: "2026-11-17",
    headline: [],
    rows: [
      {
        rowId: "SPY",
        name: "SPY",
        metrics: [
          {
            label: "Change",
            value: 0,
            unit: "percent",
            flags: ["partial"],
            periodLabel: "2026-10",
            sourceUrl: "https://example.com/source",
            secret: "never",
          },
        ],
      },
    ],
  },
});
test("closed allowlist and catalog reject executable foreign paths and unknown schema", () => {
  assert.equal(trackerIds.length, 11);
  assert.equal(
    trackerCatalog({ trackers: [{ trackerId: "../../secret" }] }).length,
    0,
  );
  const item = {
    trackerId: "market-session",
    displayName: "Session",
    description: "Description",
    accessTier: "free",
    viewType: "table",
    canonicalUrl: "https://evil.test",
  };
  const data = trackerCatalog({ trackers: [item] });
  assert.equal(data[0].id, "market-session");
  assert.ok(!JSON.stringify(data).includes("evil"));
  assert.equal(trackerCatalog({ trackers: [item, item] }), null);
  assert.equal(
    trackerCatalog({ trackers: [{ ...item, viewType: "script" }] }),
    null,
  );
});
test("snapshots preserve zero, preview, count, provenance and omit arbitrary secrets", () => {
  const v = trackerSnapshot(fixture(), "market-session");
  assert.equal(v.preview, true);
  assert.equal(v.totalCount, 4);
  assert.equal(v.rows[0].metrics[0].value, 0);
  assert.equal(v.rows[0].metrics[0].period, "2026-10");
  assert.deepEqual(v.rows[0].metrics[0].flags, ["partial"]);
  assert.ok(!JSON.stringify(v).includes("never"));
  assert.equal(v.rows[0].metrics[0].sourceUrl, "https://example.com/source");
  for (const mutate of [
    (x) => (x.data.trackerId = "other"),
    (x) => (x.data.schemaVersion = "2.0"),
    (x) => (x.isPreview = "false"),
    (x) => x.data.rows.push(x.data.rows[0]),
    (x) => (x.data.rows[0].metrics[0].value = [0]),
  ]) {
    const x = fixture();
    mutate(x);
    assert.equal(trackerSnapshot(x, "market-session"), null);
  }
  const x = fixture();
  x.data.rows[0].metrics[0].sourceUrl = "javascript:alert(1)";
  assert.equal(
    trackerSnapshot(x, "market-session").rows[0].metrics[0].sourceUrl,
    null,
  );
});
test("heatmap table preserves missing vs zero and withheld layers, not invented overlays", () => {
  const x = fixture();
  x.data.trackerId = "market-heatmap";
  x.data.viewType = "heatmap";
  x.data.meta = { previewWithheld: ["sentiment", "options"] };
  x.data.rows = [{ name: "Test", rowId: "TEST", price: 12, changePercent: 0 }];
  const r = trackerSnapshot(x, "market-heatmap");
  assert.deepEqual(r.withheld, ["sentiment", "options"]);
  assert.equal(r.rows[0].metrics[1].value, 0);
  assert.equal(r.rows[0].metrics[2].value, null);
});
function load(file, bindings, name) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const code = ts.transpileModule(
    ast.statements
      .filter((n) => !ts.isImportDeclaration(n))
      .map((n) => n.getText(ast).replace(/^export /, ""))
      .join("\n"),
    { compilerOptions: { target: ts.ScriptTarget.ES2022 } },
  ).outputText;
  return providerFixtureFunction(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}
class HttpError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
test("transport fixed host bounded one request no raw error disclosure", async () => {
  let calls = 0;
  const run = load(
    "lib/market-trackers.server.ts",
    {
      trackerIds,
      trackerCatalog,
      trackerSnapshot,
      HttpError,
      limit: async () => {},
    },
    "readMarketTracker",
  );
  const fetcher = async (url, init) => {
    calls++;
    assert.equal(
      url,
      "https://app.sentisense.ai/api/v1/trackers/market-session",
    );
    assert.equal(init.redirect, "error");
    return new Response(JSON.stringify(fixture()));
  };
  await run("market-session", { key: "synthetic", fetcher });
  assert.equal(calls, 1);
  await assert.rejects(
    run("../x", { key: "synthetic", fetcher }),
    (e) => e.status === 400,
  );
  assert.equal(calls, 1);
  for (const status of [403, 429, 404])
    await assert.rejects(
      run("market-session", {
        key: "synthetic",
        fetcher: async () => new Response("secret", { status }),
      }),
      (e) => e.status === status && !e.message.includes("secret"),
    );
  await assert.rejects(
    run("market-session", {
      key: "synthetic",
      fetcher: async () => new Response("x".repeat(2000001)),
    }),
    (e) => e.status === 502,
  );
});
test("route auth, deployment, features, quota and unknown inputs stop before provider", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const get = load(
    "app/api/market-trackers/route.ts",
    {
      HttpError,
      trackerIds,
      account: async () => {
        if (!auth) throw new HttpError("auth", 401);
        return { user: { id: "synthetic" } };
      },
      requestAccess: async () => ({ sampleOnly: sample }),
      requireFeature: () => {
        if (!feature) throw new HttpError("feature", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {
        if (!quota) throw new HttpError("quota", 429);
      },
      readMarketTracker: async () => {
        calls++;
        return {};
      },
      privateJson: (data) => ({ status: 200, data }),
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const request = (q) =>
    new Request("https://local.test/api/market-trackers" + (q ?? ""));
  auth = false;
  assert.equal((await get(request())).status, 401);
  auth = true;
  sample = true;
  assert.equal((await get(request())).status, 403);
  sample = false;
  feature = false;
  assert.equal((await get(request())).status, 403);
  feature = true;
  quota = false;
  assert.equal((await get(request())).status, 429);
  quota = true;
  for (const q of [
    "?id=evil",
    "?id=market-session&id=market-session",
    "?url=https://evil.test",
  ])
    assert.equal((await get(request(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(request("?id=market-session"))).status, 200);
  assert.equal(calls, 1);
});
test("UI only fetches selected snapshot, preserves preview and dates, avoids fanout", () => {
  const ui = fs.readFileSync("components/MarketTrackers.tsx", "utf8");
  assert.match(ui, /selected\s*\?\s*`market-trackers\?id=/);
  assert.doesNotMatch(ui, /setInterval|useEffect|SENTISENSE_API/);
  assert.match(ui, /Limited provider preview/);
  assert.match(ui, /data.asOf/);
  assert.match(ui, /data.rows.slice/);
  assert.match(ui, /not an area-scaled heatmap/);
});
