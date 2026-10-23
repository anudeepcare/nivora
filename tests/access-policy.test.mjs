import test from "node:test";
import assert from "node:assert/strict";
const m = await import("../lib/access-policy.ts").catch(() => ({}));
const now = "2026-10-23T12:00:00Z";
test("beta access expires complimentary grants without affecting paid-through access", () => {
  assert.equal(typeof m.resolveAccess, "function");
  const a = m.resolveAccess({
    enabled: true,
    owner: false,
    licensed: false,
    now,
    grant: { expiresAt: "2026-10-24T00:00:00Z" },
  });
  assert.equal(a.plan, "pro");
  assert.equal(a.sampleOnly, true);
  const b = m.resolveAccess({
    enabled: true,
    owner: false,
    licensed: false,
    now,
    grant: { expiresAt: "2026-10-22T00:00:00Z" },
  });
  assert.equal(b.plan, "free");
  const c = m.resolveAccess({
    enabled: true,
    owner: false,
    licensed: true,
    now,
    subscription: { status: "active", paidUntil: "2026-11-01T00:00:00Z" },
  });
  assert.equal(c.plan, "pro");
});
test("owner preview changes effective plan but never grants owner status to ordinary Pro users", () => {
  assert.equal(typeof m.resolveAccess, "function");
  const a = m.resolveAccess({
    enabled: true,
    owner: true,
    licensed: false,
    now,
    preview: "free",
  });
  assert.equal(a.owner, true);
  assert.equal(a.plan, "free");
  assert.equal(a.sampleOnly, false);
  assert.equal(a.features.advanced, false);
  const b = m.resolveAccess({
    enabled: true,
    owner: false,
    licensed: false,
    now,
    preview: "pro",
  });
  assert.equal(b.plan, "free");
  assert.equal(b.owner, false);
});
test("feature rules support everyone, Pro, beta and off without making Pro an administrator", () => {
  assert.equal(typeof m.resolveAccess, "function");
  const a = m.resolveAccess({
    enabled: true,
    owner: false,
    licensed: true,
    now,
    grant: { expiresAt: "2026-11-01" },
    config: {
      rules: { advanced: "off", financials: "free", value: "beta" },
      freeResearch: 7,
    },
  });
  assert.equal(a.features.advanced, false);
  assert.equal(a.features.value, true);
  assert.equal(a.features.financials, true);
  assert.equal(a.owner, false);
  assert.throws(() => m.cleanAccessConfig({ freeResearch: -1 }));
});
test("research payload projection removes locked evidence and does not mutate cached source", () => {
  assert.equal(typeof m.projectResearch, "function");
  const a = m.resolveAccess({
    enabled: true,
    owner: false,
    licensed: true,
    now,
  });
  const r = {
    company: { symbol: "ABC" },
    quote: { price: 10 },
    history: Array.from({ length: 500 }, (_, i) => ({
      time: String(i),
      close: 1,
    })),
    facts: [
      { metric: "revenue", end: "2025-12-31", id: "a" },
      { metric: "revenue", end: "2024-12-31", id: "b" },
      { metric: "debt", end: "2025-12-31", id: "c" },
    ],
    filings: [{ url: "filing" }],
    evidence: { secret: "premium" },
    snapshot: { secret: "premium" },
    issues: [],
    retrievedAt: now,
  };
  const p = m.projectResearch(r, a);
  assert.equal(p.snapshot, undefined);
  assert.equal(p.evidence, undefined);
  assert.equal(p.facts.length, 1);
  assert.equal(p.history.length, 252);
  assert.equal(r.history.length, 500);
  assert.equal(r.snapshot.secret, "premium");
});
