import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const modulePath = "../lib/independent-session-calendar.ts";
const load = () => import(modulePath);
test("bounded calendar module exists", () =>
  assert.ok(fs.existsSync("lib/independent-session-calendar.ts")));
test("all explicitly published 2026 holidays closed for both supported venues", async () => {
  const { scheduledSession } = await load();
  for (const mic of ["XNYS", "XNAS"])
    for (const date of [
      "2026-01-01",
      "2026-01-19",
      "2026-02-16",
      "2026-04-03",
      "2026-05-25",
      "2026-06-19",
      "2026-07-03",
      "2026-09-07",
      "2026-11-26",
      "2026-12-25",
    ]) {
      const r = scheduledSession(mic, date);
      assert.equal(r.status, "closed");
      assert.equal(r.reason, "published-holiday");
      assert.equal(r.closeAt, null);
    }
});
test("early closes are 13 ET not options or extended-hours close", async () => {
  const { scheduledSession } = await load();
  for (const mic of ["XNYS", "XNAS"])
    for (const date of ["2026-11-27", "2026-12-24"]) {
      const r = scheduledSession(mic, date);
      assert.equal(r.status, "scheduled");
      assert.equal(r.closeAt, date + "T18:00:00.000Z");
      assert.equal(r.openAt, date + "T14:30:00.000Z");
      assert.equal(r.earlyClose, true);
    }
});
test("IANA timezone handles both DST boundaries", async () => {
  const { scheduledSession } = await load();
  for (const [date, open, close] of [
    ["2026-03-06", "14:30", "21:00"],
    ["2026-03-09", "13:30", "20:00"],
    ["2026-10-30", "13:30", "20:00"],
    ["2026-11-02", "14:30", "21:00"],
  ]) {
    const r = scheduledSession("XNAS", date);
    assert.equal(r.openAt, `${date}T${open}:00.000Z`);
    assert.equal(r.closeAt, `${date}T${close}:00.000Z`);
  }
});
test("unknown year, venue, malformed dates cannot borrow schedule", async () => {
  const { scheduledSession } = await load();
  for (const [mic, date] of [
    ["NYSE", "2026-11-18"],
    ["BATS", "2026-11-18"],
    ["XNYS", "2025-12-31"],
    ["XNAS", "2027-01-01"],
    ["XNYS", "2026-02-30"],
    ["XNYS", {}],
  ])
    assert.equal(scheduledSession(mic, date).status, "unknown");
});
test("weekends closed and no fabricated July 2 early close", async () => {
  const { scheduledSession } = await load();
  assert.equal(scheduledSession("XNYS", "2026-07-04").reason, "weekend");
  assert.equal(
    scheduledSession("XNYS", "2026-07-02").closeAt,
    "2026-07-02T20:00:00.000Z",
  );
});
test("latest scheduled close respects exact early close and closed days", async () => {
  const { latestScheduledClose } = await load();
  assert.equal(
    latestScheduledClose("XNYS", "2026-11-27T17:59:59Z").session.date,
    "2026-11-25",
  );
  assert.equal(
    latestScheduledClose("XNYS", "2026-11-27T18:00:00Z").session.date,
    "2026-11-27",
  );
  assert.equal(
    latestScheduledClose("XNYS", "2026-11-29T23:00:00Z").session.date,
    "2026-11-27",
  );
});
test("year boundary cannot infer previous year and UTC date does not replace NY date", async () => {
  const { latestScheduledClose } = await load();
  assert.equal(
    latestScheduledClose("XNYS", "2026-01-01T22:00:00Z").session,
    null,
  );
  assert.equal(
    latestScheduledClose("XNYS", "2027-01-01T00:30:00Z").session.date,
    "2026-12-31",
  );
  assert.equal(
    latestScheduledClose("XNYS", "2027-01-01T05:00:00Z").status,
    "unknown",
  );
  for (const x of ["2026-11-18", "2026-02-30T12:00:00Z", {}, "bad"])
    assert.equal(latestScheduledClose("XNYS", x).status, "unknown");
});
test("schedule never certifies actual sessions, final provider bars or Pace and output is immutable", async () => {
  const { scheduledSession, latestScheduledClose } = await load();
  for (const r of [
    scheduledSession("XNYS", "2026-11-18"),
    latestScheduledClose("XNAS", "2026-11-18T23:00:00Z"),
  ]) {
    assert.equal(r.calendarVerified, false);
    assert.equal(r.providerBarFinalized, false);
    assert.equal(r.actualSessionVerified, false);
    assert.equal(r.readyForPace, false);
    assert.equal(r.provenance.checkedOn, "2026-11-18");
    assert.ok(Object.isFrozen(r));
    assert.ok(Object.isFrozen(r.provenance));
    assert.ok(Object.isFrozen(r.provenance.sources));
  }
});
test("server-only facade and no runtime consumers", () => {
  assert.match(
    fs.readFileSync("lib/independent-session-calendar.server.ts", "utf8"),
    /import "server-only"/,
  );
});
