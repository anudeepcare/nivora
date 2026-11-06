import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
import { calendarHighlights, marketDay } from "../lib/home-feed.ts";
import { evaluateAlert } from "../lib/alert-policy.ts";
import { portfolioRiskSummary } from "../lib/product-attention.ts";
import { readResource, resourceSnapshot } from "../lib/resource-cache.ts";

// Compile the production declaration, replacing only its imported boundaries.
// This avoids initializing provider credentials, Next, or a real account store.
function loadFunction(file, name, bindings) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const declaration = ast.statements.find(
    (node) => ts.isFunctionDeclaration(node) && node.name?.text === name,
  );
  assert.ok(declaration, `${file} must export ${name}`);
  const code = ts.transpileModule(
    declaration.getText(ast).replace(/^export\s+(?:default\s+)?/, ""),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  return new Function(...Object.keys(bindings), `${code}; return ${name};`)(
    ...Object.values(bindings),
  );
}

async function runMonitor({ asOf, knownActual, calendarActual }) {
  const requests = [];
  const writes = [];
  const rule = {
    symbol: "SOFI",
    type: "earnings-soon",
    enabled: true,
    threshold: 7,
  };
  const db = {
    from(table) {
      if (table === "auryn_documents") {
        return {
          select() {
            return {
              eq() {
                return {
                  eq: async () => ({
                    data: [
                      {
                        key: "sofi-earnings",
                        body: rule,
                        created_at: "2026-01-01",
                      },
                    ],
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }
      assert.equal(table, "auryn_alert_events");
      return {
        upsert(row) {
          writes.push(row);
          return {
            select: async () => ({ data: [{ id: "event-1" }], error: null }),
          };
        },
      };
    },
  };
  const checkAlerts = loadFunction("lib/monitor.ts", "checkAlerts", {
    createHash,
    research: async (symbol) => {
      assert.equal(symbol, "SOFI");
      return {
        retrievedAt: asOf,
        evidence: { earnings: [{ date: "2026-10-27", actual: knownActual }] },
        quote: { price: 10, stale: false },
        filings: [],
      };
    },
    canonical: () => ({ id: "snapshot-1", monthly: null }),
    eodEnabled: () => true,
    eodTicker: (symbol) => `${symbol}.US`,
    eodRequest: async (path, params, ttl) => {
      requests.push({ path, params, ttl });
      return {
        earnings: [
          {
            code: "SOFI.US",
            report_date: "2026-10-27",
            actual: calendarActual,
          },
        ],
      };
    },
    calendarHighlights,
    marketDay,
    latestFinancialEvidence: () => {
      throw Error("An earnings rule must not read financial alert baselines.");
    },
    evaluateAlert,
  });
  const result = await checkAlerts(db, "user-1");
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 1);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].path, "calendar/earnings");
  assert.equal(requests[0].params.symbols, "SOFI.US");
  return { result, requests, writes };
}

test("monitor preserves a known reported zero when the calendar still has a blank actual", async () => {
  const { result, writes } = await runMonitor({
    asOf: "2026-10-27T19:00:00Z",
    knownActual: 0,
    calendarActual: null,
  });
  assert.equal(result.created, 0);
  assert.deepEqual(
    writes,
    [],
    "A reported result must never create an approaching alert.",
  );
});

test("monitor keeps a pending exchange-day report after UTC midnight", async () => {
  const { result, requests, writes } = await runMonitor({
    asOf: "2026-10-28T01:00:00Z",
    knownActual: null,
    calendarActual: null,
  });
  assert.equal(requests[0].params.from, "2026-10-27");
  assert.equal(requests[0].params.to, "2026-11-26");
  assert.equal(result.created, 1);
  assert.equal(writes[0].event_key, "earnings:2026-10-27");
  assert.equal(writes[0].title, "SOFI: earnings approaching");
});

function mountedHooks() {
  const slots = [];
  const pendingEffects = [];
  let cursor = 0;
  let dirty = true;
  let render;
  let current;
  const changed = (before, after) =>
    !before ||
    !after ||
    before.length !== after.length ||
    after.some((value, i) => !Object.is(value, before[i]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) {
        const slot = {
          value: typeof initial === "function" ? initial() : initial,
        };
        slot.update = (value) => {
          const next = typeof value === "function" ? value(slot.value) : value;
          if (!Object.is(next, slot.value)) {
            slot.value = next;
            dirty = true;
          }
        };
        slots[index] = slot;
      }
      return [slots[index].value, slots[index].update];
    },
    useRef(initial) {
      const index = cursor++;
      return (slots[index] ??= { current: initial });
    },
    useMemo(factory, dependencies) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].dependencies, dependencies))
        slots[index] = { value: factory(), dependencies };
      return slots[index].value;
    },
    useEffect(effect, dependencies) {
      const index = cursor++;
      const old = slots[index];
      if (!old || changed(old.dependencies, dependencies)) {
        const slot = { dependencies };
        slots[index] = slot;
        pendingEffects.push(() => {
          old?.cleanup?.();
          slot.cleanup = effect();
        });
      }
    },
  };
  return {
    hooks,
    mount(fn) {
      render = fn;
    },
    async settle() {
      for (let attempts = 0; attempts < 30; attempts++) {
        if (dirty) {
          dirty = false;
          cursor = 0;
          current = render();
          while (pendingEffects.length) pendingEffects.shift()();
        }
        await new Promise((resolve) => setImmediate(resolve));
        if (!dirty) return current;
      }
      assert.fail("The mounted hook did not settle.");
    },
    unmount() {
      for (const slot of slots) slot?.cleanup?.();
    },
  };
}

function browserClock(start) {
  let now = Date.parse(start);
  let nextId = 0;
  const timers = new Map();
  const window = new EventTarget();
  const document = Object.assign(new EventTarget(), {
    visibilityState: "visible",
  });
  window.setInterval = (callback, interval) => {
    const id = ++nextId;
    timers.set(id, { callback, interval, at: now + interval });
    return id;
  };
  window.clearInterval = (id) => timers.delete(id);
  return {
    window,
    document,
    now: () => now,
    async advance(milliseconds, settle) {
      const end = now + milliseconds;
      for (;;) {
        const next = [...timers.values()]
          .filter((timer) => timer.at <= end)
          .sort((a, b) => a.at - b.at)[0];
        if (!next) break;
        now = next.at;
        next.at += next.interval;
        next.callback();
        await settle();
      }
      now = end;
      await settle();
    },
    timerCount: () => timers.size,
  };
}

test("mounted Portfolio calendar refreshes reported results and revalidates on return", async () => {
  const runner = mountedHooks();
  const clock = browserClock("2026-10-27T11:00:00Z");
  const originalNow = Date.now;
  Date.now = clock.now;
  const cache = new Map();
  const positions = [
    {
      symbol: "SOFI",
      assetType: "stock",
      currency: "USD",
      quantity: 10,
      cost: 10,
    },
  ];
  const quotes = { SOFI: { price: 10, currency: "USD" } };
  const context = { cache, demo: null, workspace: { watchlist: [] } };
  let actual = null;
  let requests = 0;
  const bindings = {
    ...runner.hooks,
    useProduct: () => context,
    window: clock.window,
    document: clock.document,
    marketDay,
    readResource,
    resourceSnapshot,
    api: async (key) => {
      assert.equal(key, "home-feed?kind=events&symbols=SOFI");
      requests++;
      return {
        events: [
          { symbol: "SOFI", date: "2026-10-27", kind: "Earnings", actual },
        ],
        issues: [],
        followed: 1,
      };
    },
  };
  try {
    bindings.useResource = loadFunction(
      "components/Session.tsx",
      "useResource",
      bindings,
    );
    const usePortfolioCalendar = loadFunction(
      "components/PortfolioRiskSummary.tsx",
      "usePortfolioCalendar",
      bindings,
    );
    runner.mount(() => usePortfolioCalendar(positions));
    let calendar = await runner.settle();
    assert.equal(requests, 1);
    assert.equal(
      portfolioRiskSummary(
        positions,
        quotes,
        calendar.data.events,
        "2026-10-27",
      ).earningsValue,
      100,
    );

    actual = 0;
    await clock.advance(300001, () => runner.settle());
    calendar = await runner.settle();
    assert.equal(
      requests,
      2,
      "A mounted calendar must revalidate when its five-minute freshness window expires.",
    );
    assert.equal(calendar.data.events[0].actual, 0);
    assert.equal(
      portfolioRiskSummary(
        positions,
        quotes,
        calendar.data.events,
        "2026-10-27",
      ).earningsValue,
      0,
    );

    clock.document.visibilityState = "hidden";
    await clock.advance(360000, () => runner.settle());
    assert.equal(
      requests,
      2,
      "Hidden tabs should not poll the earnings calendar.",
    );
    clock.document.visibilityState = "visible";
    clock.window.dispatchEvent(new Event("focus"));
    calendar = await runner.settle();
    assert.equal(
      requests,
      3,
      "Returning to a stale calendar must refresh it immediately.",
    );
    assert.equal(calendar.data.events[0].actual, 0);

    runner.unmount();
    assert.equal(
      clock.timerCount(),
      0,
      "Unmounting must clear the calendar timer.",
    );
    await clock.advance(360000, async () => {});
    clock.window.dispatchEvent(new Event("focus"));
    clock.document.dispatchEvent(new Event("visibilitychange"));
    await runner.settle();
    assert.equal(
      requests,
      3,
      "Unmounted calendar listeners must not request more data.",
    );
  } finally {
    runner.unmount();
    Date.now = originalNow;
  }
});
