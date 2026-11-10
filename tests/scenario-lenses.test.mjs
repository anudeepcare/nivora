import test from "node:test";
import assert from "node:assert/strict";
import { scenarioLenses, AGREEMENT_LIMITS } from "../lib/scenario-lenses.ts";
import { priceRiskScenarios } from "../lib/price-risk-scenarios.ts";

function research(days = 1500) {
  const history = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(2022, 0, 3 + i));
    if ([0, 6].includes(d.getUTCDay())) continue;
    const close = 100 * Math.exp(i * 0.0003 + 0.18 * Math.sin(i / 23));
    history.push({ time: d.toISOString().slice(0, 10), open: close, high: close, low: close, close, volume: 100 });
  }
  const date = history.at(-1).time;
  return {
    company: { symbol: "TEST", name: "Test", exchange: "NASDAQ", assetType: "stock", currency: "USD" },
    history,
    facts: [],
    filings: [],
    issues: [],
    quote: { price: history.at(-1).close, changePct: 0, currency: "USD", asOf: date + "T21:00:00Z", session: "closed", source: "t", stale: false },
    retrievedAt: date + "T23:00:00Z",
  };
}
const withAnalyst = (r, consensus) => ({ ...r, evidence: { updatedAt: r.retrievedAt.slice(0, 10), consensus, estimates: [] } });

test("one-year historical range is opt-in, needs three years and leaves the default horizon unchanged", () => {
  const r = research();
  const base = priceRiskScenarios(r), year = priceRiskScenarios(r, { horizon: 252 });
  assert.equal(base.available && base.horizon, 63);
  assert.equal(year.available && year.horizon, 252);
  assert.ok(year.independent >= 3 && year.independent < year.samples);
  assert.ok(year.cases[0].target < year.cases[1].target && year.cases[1].target < year.cases[2].target);
  const short = priceRiskScenarios(research(500), { horizon: 252 });
  assert.equal(short.available, false);
  assert.deepEqual(priceRiskScenarios(r, {}), base);
});

test("history alone yields ordered lenses, a single-method agreement and no invented analyst or model rows", () => {
  const v = scenarioLenses(research());
  assert.equal(v.available, true);
  assert.deepEqual(v.lenses.map((x) => x.id), ["history-12m", "history-3m"]);
  for (const x of v.lenses) assert.ok(x.bear < x.base && x.base < x.bull);
  assert.equal(v.primary.id, "history-12m");
  assert.equal(v.agreement.level, "single");
  assert.equal(v.agreement.spread, null);
  assert.deepEqual(v.agreement.compared, ["history-12m"]);
});

test("short history falls back to a labelled 1-month row instead of leaving a recent listing with nothing", () => {
  const v = scenarioLenses(research(300));
  // ~214 sessions: the engine's 20-session range is shown as one month, never as three.
  assert.deepEqual(v.lenses.map((x) => x.id), ["history-1m"]);
  assert.match(v.lenses[0].horizon, /one month · 20 sessions/);
  assert.equal(v.agreement.level, "single");
  assert.deepEqual(v.agreement.compared, []);
  const mid = scenarioLenses(research(500));
  assert.deepEqual(mid.lenses.map((x) => x.id), ["history-3m"]);
  assert.equal(scenarioLenses(research(60)).available, false);
});

test("shorter historical rows never count as agreement with longer-dated targets", () => {
  const r = research(500), price = r.quote.price;
  const v = scenarioLenses(withAnalyst(r, { target: price * 3 }));
  assert.deepEqual(v.agreement.compared, ["analyst"]);
  assert.equal(v.agreement.level, "single");
});

test("a split-sized one-session move is flagged rather than silently trusted or removed", () => {
  const r = research();
  assert.deepEqual(scenarioLenses(r).warnings, []);
  const k = r.history.length - 200;
  r.history = r.history.map((b, i) => (i >= k ? { ...b, open: b.open / 10, high: b.high / 10, low: b.low / 10, close: b.close / 10 } : b));
  r.quote.price = r.history.at(-1).close;
  const v = scenarioLenses(r);
  assert.equal(v.warnings.length, 1);
  assert.match(v.warnings[0], /-90% on \d{4}-\d{2}-\d{2}/);
  assert.ok(v.lenses.length >= 1);
});

test("a model takes priority, analyst consensus without a range stays a base-only row, and nothing is averaged", () => {
  const r = research(), price = r.quote.price;
  const v = scenarioLenses(withAnalyst(r, { target: price * 1.1 }), {
    model: { label: "AURYN earnings model", bear: price * 0.8, base: price * 1.05, bull: price * 1.5, end: "2027-12-31" },
  });
  assert.equal(v.primary.id, "model");
  const analyst = v.lenses.find((x) => x.id === "analyst");
  assert.equal(analyst.bear, null);
  assert.equal(analyst.bull, null);
  assert.ok(Math.abs(analyst.base - price * 1.1) < 1e-9);
  assert.ok(!v.lenses.some((x) => x.id === "revenue"));
  assert.equal(v.position.state, "inside");
  assert.ok(Math.abs(v.position.percent - (0.2 / 0.7) * 100) < 1e-6);
  assert.ok(Math.abs(v.asymmetry.upside - 50) < 1e-6 && Math.abs(v.asymmetry.downside - 20) < 1e-6);
  assert.ok(Math.abs(v.asymmetry.ratio - 2.5) < 1e-6);
  // Envelope reports observed extremes only.
  assert.equal(v.envelope.bull.high, Math.max(...v.lenses.filter((x) => x.bull != null).map((x) => x.bull)));
});

test("agreement reflects how far informative base cases sit apart and excludes the 3-month row when a 1-year row exists", () => {
  const r = research(), price = r.quote.price;
  const year = scenarioLenses(r).lenses.find((x) => x.id === "history-12m").base;
  const near = scenarioLenses(withAnalyst(r, { target: year * 1.02, low: year * 0.7, high: year * 1.4 }));
  assert.deepEqual(near.agreement.compared, ["analyst", "history-12m"]);
  assert.equal(near.agreement.level, "aligned");
  assert.ok(near.agreement.spread <= AGREEMENT_LIMITS.aligned);
  assert.equal(near.primary.id, "analyst");
  const far = scenarioLenses(withAnalyst(r, { target: year + price * 2 }));
  assert.equal(far.agreement.level, "wide");
  assert.ok(Math.abs(far.agreement.spread - 200) < 1e-6);
  assert.equal(far.primary.id, "history-12m");
});

test("price outside the primary range is reported, with no ratio manufactured", () => {
  const r = research(), price = r.quote.price;
  const v = scenarioLenses(r, { model: { label: "M", bear: price * 1.2, base: price * 1.5, bull: price * 2 } });
  assert.equal(v.position.state, "below-bear");
  assert.equal(v.asymmetry.ratio, null);
  const above = scenarioLenses(r, { model: { label: "M", bear: price * 0.4, base: price * 0.5, bull: price * 0.9 } });
  assert.equal(above.position.state, "above-bull");
  assert.equal(above.asymmetry.ratio, null);
});

test("invalid or unordered inputs are dropped rather than repaired", () => {
  const r = research(), price = r.quote.price;
  const v = scenarioLenses(withAnalyst(r, { target: -5 }), { model: { label: "M", bear: price * 2, base: price, bull: price * 3 } });
  assert.ok(!v.lenses.some((x) => x.id === "model" || x.id === "analyst"));
  const stale = withAnalyst(r, { target: price });
  stale.evidence.updatedAt = "2020-01-01";
  assert.ok(!scenarioLenses(stale).lenses.some((x) => x.id === "analyst"));
  assert.equal(scenarioLenses({ ...r, quote: { ...r.quote, currency: "EUR" } }).available, false);
  assert.equal(scenarioLenses({ ...r, history: [], quote: { ...r.quote, price: null } }).available, false);
});

test("historical rows are rescaled to the shared reference so every row compares with one price", () => {
  const r = research();
  const v = scenarioLenses(r), h = priceRiskScenarios(r, { horizon: 252 });
  const row = v.lenses.find((x) => x.id === "history-12m");
  for (let i = 0; i < 3; i++)
    assert.ok(Math.abs([row.bear, row.base, row.bull][i] - v.reference.price * (1 + h.cases[i].change / 100)) < 1e-9);
});
