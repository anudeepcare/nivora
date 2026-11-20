import test from "node:test";
import assert from "node:assert/strict";

const day = "2026-11-20";
const now = "2026-11-20T17:00:00Z";
const report = (symbol, date, actual) => ({
  symbol,
  date,
  kind: "Earnings",
  detail: "",
  actual,
  estimate: 0.3,
});
const headline = (symbol, title, date = now) => ({
  symbol,
  title,
  date,
  url: "https://example.com/article",
});
const choose = async (input) =>
  (await import("../lib/today-narrative.ts")).todayNarrative({
    day,
    now,
    reports: [],
    headlines: [],
    checkpoints: [],
    ...input,
  });

test("a dated finite reported result outranks headlines, preserves zero, and matches only a dated same-symbol catalyst", async () => {
  const item = await choose({
    reports: [report("APP", "2026-11-21", 99), report("APP", day, 0)],
    headlines: [headline("APP", "Applovin stock drops")],
    checkpoints: [report("HIMS", day, null), report("APP", "2026-11-25", null)],
  });
  assert.equal(item.kind, "report");
  assert.equal(item.report.actual, 0);
  assert.equal(item.report.estimate, 0.3);
  assert.equal(item.next.symbol, "APP");
  assert.equal(item.next.date, "2026-11-25");
  assert.match(item.question, /reported EPS/);
});
test("source headlines rank by evidence type, reject malformed/future articles, and retain the raw title", async () => {
  const item = await choose({
    headlines: [
      headline("APP", "AppLovin shares rise", "2026-11-20T16:00:00Z"),
      headline("NOW", "ServiceNow files its 10-Q", "2026-11-19T10:00:00Z"),
      headline("APP", "AppLovin files 10-K", "2026-11-21T10:00:00Z"),
      { ...headline("QQQ", "QQQ files a 10-K"), url: "https://not a URL" },
    ],
    checkpoints: [report("APP", "2026-11-25", null)],
  });
  assert.equal(item.kind, "headline");
  assert.equal(item.headline.title, "ServiceNow files its 10-Q");
  assert.equal(item.source, "example.com");
  assert.equal(item.next, null);
  assert.match(item.question, /filing/);
});
test("future, malformed, or stale evidence produces an honest empty state", async () => {
  const item = await choose({
    reports: [report("APP", day, null), report("APP", "2026-11-12", 6)],
    headlines: [headline("APP", "AppLovin shares rise", "2026-11-12")],
  });
  assert.equal(item, null);
});

test("a substantive company headline can point to an as-yet-unconfirmed same-day catalyst", async () => {
  const item = await choose({
    headlines: [headline("APP", "AppLovin files its 10-Q")],
    checkpoints: [
      { ...report("APP", day, null), detail: "After market close" },
    ],
  });
  assert.equal(item.next.date, day);
  assert.equal(item.next.detail, "After market close");
});

test("routine price moves stay in the news list; substantive SPY macro coverage can lead", async () => {
  assert.equal(
    await choose({ headlines: [headline("APP", "AppLovin stock drops")] }),
    null,
  );
  const item = await choose({
    market: true,
    headlines: [
      headline(
        "SPY",
        "Federal Reserve decision in focus as inflation data arrive",
      ),
    ],
  });
  assert.equal(item.kind, "headline");
  assert.match(item.question, /scheduled release|actual decision/);
  assert.equal(item.next, null);
});
