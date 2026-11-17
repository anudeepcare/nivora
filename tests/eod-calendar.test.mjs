import test from "node:test";
import assert from "node:assert/strict";
import { calendarWindow, normalizeEodCalendar } from "../lib/eod-calendar.ts";
test("event windows are bounded and deterministic", () => {
  assert.deepEqual(calendarWindow(7, new Date("2026-11-17T23:00:00Z")), {
    from: "2026-11-17",
    to: "2026-11-24",
  });
  assert.throws(() => calendarWindow(365));
});
test("IPO zero prices and shares are not real offers; currency and status stay explicit", () => {
  const v = normalizeEodCalendar(
    "ipos",
    {
      ipos: [
        {
          code: "TEST.US",
          name: "Test",
          start_date: "2026-11-20",
          price_from: 0,
          price_to: 0,
          offer_price: 0,
          shares: 0,
          currency: "USD",
          deal_type: "Expected",
        },
      ],
    },
    "2026-11-17",
    "2026-11-24",
  );
  assert.equal(v.length, 1);
  assert.equal(v[0].offerPrice, null);
  assert.equal(v[0].shares, null);
  assert.equal(v[0].status, "Expected");
});
test("split ratios preserve old-to-new direction and reject zero denominators without inventing a factor", () => {
  const v = normalizeEodCalendar(
    "splits",
    {
      splits: [
        {
          code: "REV.US",
          split_date: "2026-11-18",
          old_shares: 10,
          new_shares: 1,
        },
        {
          code: "BAD.US",
          split_date: "2026-11-19",
          old_shares: 1,
          new_shares: 0,
        },
      ],
    },
    "2026-11-17",
    "2026-11-24",
  );
  assert.equal(v[0].ratio, "10 → 1");
  assert.equal(v[0].status, "Reverse split");
  assert.equal(v[1].ratio, null);
  assert.equal(v[1].status, "Ratio not supplied");
});
test("calendar validates schema, excludes out-of-window events and never maps foreign listings to US", () => {
  assert.throws(() =>
    normalizeEodCalendar("ipos", { error: "x" }, "2026-11-17", "2026-11-24"),
  );
  const v = normalizeEodCalendar(
    "ipos",
    {
      ipos: [
        { code: "TEST.LSE", start_date: "2026-11-20" },
        { code: "OLD.US", start_date: "2025-11-20" },
      ],
    },
    "2026-11-17",
    "2026-11-24",
  );
  assert.equal(v.length, 1);
  assert.equal(v[0].symbol, "TEST.LSE");
  assert.equal(v[0].researchSymbol, null);
});

test("calendar route validates fixed paths and access before any provider read", async () => {
  const fs = await import("node:fs");
  const { default: ts } = await import("typescript");
  const ast = ts.createSourceFile(
    "route.ts",
    fs.readFileSync("app/api/corporate-calendar/route.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const source = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) => n.getText(ast).replace(/^export /, ""))
    .join("\n");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  class HttpError extends Error {
    constructor(message, status = 400) {
      super(message);
      this.status = status;
    }
  }
  for (const [query, allowed, status] of [
    ["kind=arbitrary", true, 400],
    ["kind=ipos&days=365", true, 400],
    ["kind=ipos", false, 403],
    ["kind=splits&days=7", true, 200],
  ]) {
    const calls = [];
    const b = {
      HttpError,
      calendarWindow,
      normalizeEodCalendar,
      account: async () => ({ user: { id: "test" } }),
      limit: async () => calls.push("limit"),
      requestAccess: async () => ({
        enabled: true,
        owner: false,
        features: { news: allowed },
      }),
      eodRequest: async (path, params, ttl) => {
        calls.push(path);
        assert.ok(params.from && params.to);
        assert.equal(ttl, 900000);
        return { splits: [] };
      },
      privateJson: (v) =>
        Response.json(v, { headers: { "Cache-Control": "private, no-store" } }),
      failure: (e) =>
        Response.json({ error: e.message }, { status: e.status ?? 503 }),
    };
    const get = new Function(...Object.keys(b), js + ";return GET;")(
      ...Object.values(b),
    );
    const r = await get(
      new Request("https://example.test/api/corporate-calendar?" + query),
    );
    assert.equal(r.status, status);
    assert.equal(
      calls.filter((x) => x.startsWith("calendar/")).length,
      status === 200 ? 1 : 0,
    );
    if (status === 200)
      assert.match(r.headers.get("Cache-Control"), /no-store/);
  }
});
