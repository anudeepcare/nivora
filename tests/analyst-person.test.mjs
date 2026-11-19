import { providerFixtureFunction } from "./helpers/sentisense-transport.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  analystSlug,
  personProfile,
  personCalls,
  namedAnalysts,
} from "../lib/analyst-person.ts";
const now = Date.parse("2026-11-18T12:00:00Z");
const profile = () => ({
  isPreview: true,
  totalCount: 10,
  data: {
    slug: "example-analyst",
    name: "Example Analyst",
    role: "sell_side_equity",
    mostRecentFirm: "Firm",
    firstSeen: "2025-01-01",
    lastSeen: "2026-11-17",
    noteCount: 10,
    tickerCount: 10,
    firms: [
      {
        firm: "Firm",
        firstSeen: "2025-01-01",
        lastSeen: "2026-11-17",
        mostRecent: true,
      },
    ],
    coverage: [
      {
        ticker: "AAPL",
        noteCount: 1,
        firstNote: "2025-01-01",
        lastNote: "2026-11-17",
        latestPriceTarget: 123,
        latestFirm: "Firm",
      },
    ],
  },
});
test("slugs are observed public handles, no name guessing or path acceptance", () => {
  assert.equal(analystSlug("example-analyst"), "example-analyst");
  for (const x of ["../x", "a/b", "https://evil", "A Name", null])
    assert.equal(analystSlug(x), null);
  assert.deepEqual(
    namedAnalysts({
      coverage: [
        {
          analysts: [
            { name: "Unlinked", slug: null },
            { name: "Example", slug: "example-analyst" },
            { name: "Example", slug: "example-analyst" },
          ],
        },
      ],
    }),
    [{ name: "Example", slug: "example-analyst" }],
  );
});
test("profile retains preview and observation dates, rejects mismatches/future", () => {
  const p = personProfile(profile(), "example-analyst", now);
  assert.equal(p.preview, true);
  assert.equal(p.total, 10);
  assert.equal(p.firms[0].last, "2026-11-17");
  for (const change of [
    (x) => (x.data.slug = "other"),
    (x) => (x.data.lastSeen = "2030-01-01"),
    (x) => (x.data.firms[0].firstSeen = "2026-02-30"),
    (x) => (x.data.noteCount = true),
  ]) {
    const x = profile();
    change(x);
    assert.equal(personProfile(x, "example-analyst", now), null);
  }
});
test("paged notes preserve targets independently and no hit rates or employment inference", () => {
  const r = {
    isPreview: false,
    totalCount: 26,
    data: [
      {
        publishedDate: "2026-11-17",
        ticker: "AAPL",
        firm: "Old Firm",
        priceTarget: 100,
        adjPriceTarget: 50,
        priceWhenPosted: null,
        newsTitle: "Report",
        newsUrl: "https://example.com/report",
        newsPublisher: "Publisher",
      },
    ],
  };
  const p = personCalls(r, "example-analyst", 0, now);
  assert.equal(p.rows[0].target, 100);
  assert.equal(p.rows[0].adjusted, 50);
  assert.equal(p.rows[0].price, null);
  assert.equal(p.offset, 0);
  assert.equal(
    personCalls(
      { ...r, data: [{ ...r.data[0], publishedDate: "2030-01-01" }] },
      "example-analyst",
      0,
      now,
    ),
    null,
  );
  assert.equal(personCalls(r, "example-analyst", -25, now), null);
  assert.equal(personCalls(r, "example-analyst", 1, now), null);
  assert.equal(
    personCalls(
      { ...r, data: [{ ...r.data[0], newsUrl: "javascript:alert(1)" }] },
      "example-analyst",
      0,
      now,
    ).rows[0].url,
    null,
  );
});

import fs from "node:fs";
import ts from "typescript";
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
test("profile transport fixed identity path and calls fixed25 row budget, no secret leakage", async () => {
  const run = load(
    "lib/analyst-person.server.ts",
    {
      analystSlug,
      personProfile,
      personCalls,
      HttpError,
      limit: async () => {},
    },
    "readAnalystPerson",
  );
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.equal(
      url,
      "https://app.sentisense.ai/api/v1/analyst/people/example-analyst/calls?limit=25&offset=25",
    );
    assert.equal(options.redirect, "error");
    return new Response(
      JSON.stringify({ isPreview: true, totalCount: 40, data: [] }),
    );
  };
  await run("example-analyst", "calls", 25, { key: "synthetic", fetcher });
  assert.equal(calls, 1);
  for (const [slug, mode, offset] of [
    ["../x", "profile", 0],
    ["example-analyst", "calls", 10025],
    ["example-analyst", "profile", 25],
  ])
    await assert.rejects(
      run(slug, mode, offset, { key: "synthetic", fetcher }),
      (e) => e.status === 400,
    );
  assert.equal(calls, 1);
  await assert.rejects(
    run("example-analyst", "profile", 0, {
      key: "synthetic",
      fetcher: async () => {
        throw Error("secret");
      },
    }),
    (e) => e.status === 503 && !e.message.includes("secret"),
  );
});
test("route auth, analyst feature and reservation precede provider calls, duplicate inputs blocked", async () => {
  let auth = true,
    sample = false,
    feature = true,
    quota = true,
    calls = 0;
  const get = load(
    "app/api/analyst-person/route.ts",
    {
      HttpError,
      analystSlug,
      account: async () => {
        if (!auth) throw new HttpError("auth", 401);
        return { user: { id: "synthetic" } };
      },
      requestAccess: async () => ({ sampleOnly: sample }),
      requireFeature: (_, name) => {
        assert.equal(name, "analysts");
        if (!feature) throw new HttpError("feature", 403);
      },
      limit: async () => {},
      reserveAccess: async () => {
        if (!quota) throw new HttpError("quota", 429);
      },
      readAnalystPerson: async () => {
        calls++;
        return {};
      },
      privateJson: (data) => ({ status: 200, data }),
      failure: (e) => ({ status: e.status }),
    },
    "GET",
  );
  const req = (q) =>
    new Request(
      "https://local.test/api/analyst-person" + (q ?? "?slug=example-analyst"),
    );
  auth = false;
  assert.equal((await get(req())).status, 401);
  auth = true;
  sample = true;
  assert.equal((await get(req())).status, 403);
  sample = false;
  feature = false;
  assert.equal((await get(req())).status, 403);
  feature = true;
  quota = false;
  assert.equal((await get(req())).status, 429);
  quota = true;
  for (const q of [
    "?slug=../x",
    "?slug=example-analyst&slug=other",
    "?slug=example-analyst&offset=1",
    "?slug=example-analyst&mode=profile&offset=25",
    "?slug=example-analyst&url=https://evil.test",
  ])
    assert.equal((await get(req(q))).status, 400);
  assert.equal(calls, 0);
  assert.equal((await get(req())).status, 200);
  assert.equal(calls, 1);
});
test("coverage DTO retains observed slug only and UI is opt-in without guessing identity", async () => {
  const { publicIntelligence } = await import("../lib/intelligence-dto.ts");
  const result = publicIntelligence({
    dataset: "analystCoverage",
    status: "available",
    data: {
      ticker: "AAPL",
      coverage: [
        {
          firm: "Firm",
          analysts: [
            { name: "Example", slug: "example-analyst", secret: "never" },
          ],
        },
      ],
    },
  });
  assert.deepEqual(namedAnalysts(result.data), [
    { slug: "example-analyst", name: "Example" },
  ]);
  assert.ok(!JSON.stringify(result).includes("never"));
  const ui = fs.readFileSync("components/NamedAnalystProfiles.tsx", "utf8");
  assert.match(ui, /slug\s*\?\s*`analyst-person/);
  assert.doesNotMatch(ui, /useEffect|setInterval|SENTISENSE_API/);
  assert.match(ui, /not\s+employment\s+dates/);
  assert.match(ui, /calls.preview/);
  assert.match(ui, /offset >= 10000/);
});

test("preview paging never relabels an allowance slice as a later page; counts stay consistent", () => {
  const row = {
    publishedDate: "2026-11-17",
    ticker: "AAPL",
    firm: "Firm",
    priceTarget: 100,
    adjPriceTarget: 50,
    priceWhenPosted: null,
    newsTitle: "Report",
    newsUrl: null,
    newsPublisher: "Publisher",
  };
  const preview = personCalls(
    { isPreview: true, totalCount: 100, data: [row] },
    "example-analyst",
    25,
    now,
  );
  assert.deepEqual(preview.rows, []);
  assert.equal(preview.preview, true);
  assert.equal(preview.withheldPage, true);
  assert.equal(
    personCalls(
      { isPreview: false, totalCount: 25, data: [row] },
      "example-analyst",
      25,
      now,
    ),
    null,
  );
  const p = profile();
  p.totalCount = 0;
  assert.equal(personProfile(p, "example-analyst", now), null);
});

test("documented next-day publisher dates are retained without inventing time precision", () => {
  const p = profile();
  p.data.lastSeen = "2026-11-19";
  p.data.firms[0].lastSeen = "2026-11-19";
  p.data.coverage[0].lastNote = "2026-11-19";
  assert.ok(
    personProfile(p, "example-analyst", Date.parse("2026-11-18T22:00:00Z")),
  );
  p.data.lastSeen = "2026-11-20";
  assert.equal(
    personProfile(p, "example-analyst", Date.parse("2026-11-18T22:00:00Z")),
    null,
  );
});

test("calls admit documented next-day publisher labels but reject farther future", () => {
  const row = {
    publishedDate: "2026-11-19",
    ticker: "AAPL",
    firm: "Firm",
    priceTarget: 100,
    adjPriceTarget: 50,
    priceWhenPosted: null,
    newsTitle: "Report",
    newsUrl: null,
    newsPublisher: "Publisher",
  };
  const raw = { isPreview: false, totalCount: 1, data: [row] };
  assert.ok(
    personCalls(raw, "example-analyst", 0, Date.parse("2026-11-18T22:00:00Z")),
  );
  assert.equal(
    personCalls(
      { ...raw, data: [{ ...row, publishedDate: "2026-11-20" }] },
      "example-analyst",
      0,
      Date.parse("2026-11-18T22:00:00Z"),
    ),
    null,
  );
});
