import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { createHash } from "node:crypto";
import { evaluateAlert } from "../lib/alert-policy.ts";
function load(bindings) {
  const source = ts.createSourceFile(
    "monitor.ts",
    fs.readFileSync("lib/monitor.ts", "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const fn = source.statements.find(
    (n) => ts.isFunctionDeclaration(n) && n.name?.text === "checkAlerts",
  );
  const js = ts.transpileModule(fn.getText(source).replace("export ", ""), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  }).outputText;
  return new Function(...Object.keys(bindings), js + ";return checkAlerts;")(
    ...Object.values(bindings),
  );
}
test("bounded monitor resumes across calls and reaches all 26 rules", async () => {
  const rules = Array.from({ length: 26 }, (_, i) => ({
    key: String(i).padStart(3, "0"),
    body: {
      symbol: "S" + i,
      type: "monthly-zone",
      threshold: 1,
      enabled: true,
    },
    created_at: "2026-01-01",
  }));
  let cursor = null;
  const visited = [];
  const db = {
    from(table) {
      if (table === "auryn_alert_events")
        return {
          upsert: () => ({ select: async () => ({ data: [], error: null }) }),
        };
      let kind;
      const q = {
        select: () => q,
        eq: (key, value) => {
          if (key === "kind") kind = value;
          return q;
        },
        maybeSingle: async () => ({
          data: cursor ? { body: cursor } : null,
          error: null,
        }),
        then: (resolve) =>
          Promise.resolve({
            data: kind === "alert" ? rules : [],
            count: 26,
            error: null,
          }).then(resolve),
        upsert: async (row) => {
          cursor = row.body;
          return { error: null };
        },
      };
      return q;
    },
  };
  const check = load({
    createHash,
    research: async (symbol) => {
      visited.push(symbol);
      return {
        quote: { price: 10, stale: false },
        retrievedAt: "2026-10-27T20:00:00Z",
        filings: [],
      };
    },
    canonical: () => ({
      id: "s",
      monthly: { multiplier: 1, month: "2026-09" },
    }),
    eodEnabled: () => false,
    evaluateAlert,
  });
  for (let i = 0; i < 3; i++) {
    const result = await check(db, "owner");
    assert.equal(result.total, 26);
    assert.equal(result.batchSize, 12);
    assert.equal(result.checked, 12);
  }
  assert.equal(new Set(visited).size, 26);
});
test("Pace notifications use zones and do not imply P4 guarantees a Buy", () => {
  for (const level of [0, 1, 2, 3, 4]) {
    const event = evaluateAlert(
      { symbol: "APP", type: "monthly-zone", threshold: level, enabled: true },
      {
        snapshotId: "s",
        price: 10,
        stale: false,
        monthly: level,
        month: "2026-09",
        filings: [],
      },
      "",
    );
    assert.match(event.title, new RegExp("P" + level));
    assert.doesNotMatch(event.title, /×/);
    assert.match(event.detail, /business.*before buying/i);
  }
});

test("monitor rejects truncated lists and cursor-store failures before provider work", async () => {
  for (const failure of ["truncated", "read", "write"]) {
    const records = Array.from({ length: 13 }, (_, i) => ({
      key: String(i),
      body: { enabled: true, symbol: "APP" },
    }));
    const q = {
      select: () => q,
      eq: () => q,
      then: (resolve) =>
        Promise.resolve({
          data: records,
          count: failure === "truncated" ? 14 : 13,
          error: null,
        }).then(resolve),
      maybeSingle: async () => ({
        data: null,
        error: failure === "read" ? {} : null,
      }),
      upsert: async () => ({ error: failure === "write" ? {} : null }),
    };
    const check = load({
      createHash,
      research: () => {
        throw Error("Provider must not be called");
      },
    });
    await assert.rejects(
      check({ from: () => q }, "owner"),
      failure === "truncated" ? /truncated/ : /continuation/,
    );
  }
});

test("missing financial alert inputs produce an explicit evaluation warning", async () => {
  const records = [
    {
      key: "cash",
      body: {
        symbol: "APP",
        enabled: true,
        type: "current-below",
        threshold: 1,
      },
    },
  ];
  const q = {
    select: () => q,
    eq: () => q,
    then: (resolve) =>
      Promise.resolve({ data: records, count: 1, error: null }).then(resolve),
  };
  const check = load({
    createHash,
    research: async () => ({ quote: { price: 1, stale: false } }),
    canonical: () => ({ id: "s", monthly: null }),
    latestFinancialEvidence: () => ({ latest: null }),
  });
  const result = await check({ from: () => q }, "owner");
  assert.match(result.errors.join(" "), /financial input.*not evaluated/);
});

test("interrupted batch checkpoint does not jump over its unattempted tail", async () => {
  const records = Array.from({ length: 24 }, (_, i) => ({
    key: String(i).padStart(3, "0"),
    body: {
      enabled: true,
      symbol: "S" + i,
      type: "monthly-zone",
      threshold: 1,
    },
  }));
  let cursor = null;
  const visited = [];
  const q = {
    select: () => q,
    eq: () => q,
    then: (resolve) =>
      Promise.resolve({ data: records, count: 24, error: null }).then(resolve),
    maybeSingle: async () => ({
      data: cursor ? { body: cursor } : null,
      error: null,
    }),
    upsert: async (row) => {
      cursor = row.body;
      return { error: null };
    },
  };
  const check = load({
    createHash,
    research: async (symbol) => {
      visited.push(symbol);
      if (visited.length === 6) return new Promise(() => {});
      return { quote: { price: 1, stale: false }, filings: [] };
    },
    canonical: () => ({ id: "s", monthly: null }),
    evaluateAlert: () => null,
  });
  // A hanging external request has no timers and cannot keep node alive. Inspect
  // durable progress while the invocation is suspended, as after host termination.
  void check({ from: () => q }, "owner");
  for (let i = 0; i < 80 && visited.length < 6; i++) await Promise.resolve();
  assert.equal(visited.length, 6);
  assert.equal(cursor.filter, "005");
});
