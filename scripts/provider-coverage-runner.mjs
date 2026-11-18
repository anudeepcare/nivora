/** INACTIVE orchestration harness. No fetch, credentials, CLI, provider SDK or app imports.
 * Dependencies MUST be trusted server-owned authorization/quota/validation adapters.
 * Synthetic tests do not establish a live account's entitlement or data coverage. */
import { createHash } from "node:crypto";
const DEFINITIONS = Object.freeze([
  Object.freeze({ dataset: "profile", source: "EODHD", cost: 10 }),
  Object.freeze({ dataset: "adjusted-history", source: "EODHD", cost: 1 }),
  Object.freeze({ dataset: "consensus", source: "SentiSense", cost: 1 }),
]);
const date = (x) =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(x) &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString().slice(0, 10) === x;
const instant = (x) =>
  typeof x === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(x) &&
  Number.isFinite(Date.parse(x)) &&
  new Date(x).toISOString() ===
    (x.length === 20 ? x.slice(0, -1) + ".000Z" : x);
const id = (x) => typeof x === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(x);
function freeze(v) {
  if (v && typeof v === "object") {
    for (const x of Object.values(v)) freeze(x);
    Object.freeze(v);
  }
  return v;
}
export function coveragePlan(input) {
  if (
    !input ||
    input.version !== 1 ||
    !id(input.ownerId) ||
    !id(input.runId) ||
    input.source !== "authorized-provider-directory" ||
    !instant(input.capturedAt) ||
    !date(input.from) ||
    !date(input.to) ||
    input.from > input.to ||
    input.to > input.capturedAt.slice(0, 10) ||
    Date.parse(input.to) - Date.parse(input.from) > 3660 * 86400000 ||
    !Array.isArray(input.tickers) ||
    input.tickers.length < 1 ||
    input.tickers.length > 500 ||
    Array.from(input.tickers).some(
      (t) =>
        typeof t !== "string" || !/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)?\.US$/.test(t),
    ) ||
    new Set(input.tickers).size !== input.tickers.length
  )
    throw Error("Invalid bounded provider-directory manifest.");
  const manifest = {
    version: 1,
    ownerId: input.ownerId,
    runId: input.runId,
    source: input.source,
    capturedAt: input.capturedAt,
    from: input.from,
    to: input.to,
    tickers: [...input.tickers],
  };
  const manifestHash = createHash("sha256")
    .update(JSON.stringify(manifest))
    .digest("hex");
  return freeze({
    manifest,
    manifestHash,
    concurrency: 1,
    cost: {
      eodhd: input.tickers.length * 11,
      sentisense: input.tickers.length,
    },
    rows: input.tickers.flatMap((providerTicker) =>
      DEFINITIONS.map((d) => ({ ...d, providerTicker })),
    ),
  });
}
const STATUSES = new Set([
  "not-tested",
  "in-flight",
  "unknown-outcome",
  "available",
  "partial",
  "no-coverage",
  "unauthorized",
  "restricted",
  "rate-limited",
  "invalid-evidence",
  "unavailable",
]);
const terminal = new Set([
  "available",
  "partial",
  "no-coverage",
  "invalid-evidence",
  "unavailable",
]);
function summary(raw, row) {
  if (
    !raw ||
    typeof raw !== "object" ||
    !STATUSES.has(raw.status) ||
    ["not-tested", "in-flight", "unknown-outcome"].includes(raw.status)
  )
    return { status: "invalid-evidence" };
  if (raw.providerTicker !== row.providerTicker)
    return { status: "invalid-evidence" };
  if (
    ["available", "partial"].includes(raw.status) &&
    (!Number.isInteger(raw.recordCount) ||
      raw.recordCount < 1 ||
      raw.recordCount > 100000 ||
      !(raw.observedAt === null || date(raw.observedAt)) ||
      !(
        raw.currency === null ||
        (typeof raw.currency === "string" &&
          Intl.supportedValuesOf("currency").includes(raw.currency))
      ))
  )
    return { status: "invalid-evidence" };
  return {
    status: raw.status,
    ...(["available", "partial"].includes(raw.status)
      ? {
          recordCount: raw.recordCount,
          observedAt: raw.observedAt,
          currency: raw.currency,
        }
      : {}),
  };
}
/** Restore checkpoints only from trusted owner-scoped storage, not browser JSON.
 * reserve() atomically enforces shared provider budget, rate and user allowance.
 * read() performs at most ONE fixed dataset acquisition with no fallback/retries,
 * validates raw data/identity, returns only the closed summary contract above.
 * checkpoint() must durably replace the owner's run record or throw; never ignore failure. */
export async function runCoverage(input, deps, previous = null) {
  const plan = coveragePlan(input);
  const invoke = async (name, ...args) => {
    try {
      return await deps[name](...args);
    } catch {
      throw Error("Coverage dependency unavailable: " + name);
    }
  };
  const clock = () => {
    let v;
    try {
      v = deps.now();
    } catch {
      throw Error("Audit clock unavailable.");
    }
    if (!instant(v)) throw Error("Valid audit clock required.");
    return v;
  };
  const auth = await invoke("authorize", plan);
  if (!auth || auth.allowed !== true || auth.userId !== plan.manifest.ownerId)
    throw Error("Owner authorization required.");
  const quota = await invoke("quota", plan);
  const checkedAt = Date.parse(clock());
  if (
    !quota ||
    quota.verified !== true ||
    !instant(quota.verifiedAt) ||
    Date.parse(quota.verifiedAt) > checkedAt ||
    checkedAt - Date.parse(quota.verifiedAt) > 60000 ||
    ![quota.eodhdRemaining, quota.sentisenseRemaining].every(
      (x) => Number.isSafeInteger(x) && x >= 0,
    )
  )
    throw Error("Verified source quotas required.");
  const rows = plan.rows.map((row) => ({
    ...row,
    status: "not-tested",
    testedAt: null,
  }));
  if (previous) {
    if (
      previous.schema !== 1 ||
      previous.ownerId !== auth.userId ||
      previous.runId !== plan.manifest.runId ||
      previous.manifestHash !== plan.manifestHash ||
      !Array.isArray(previous.rows) ||
      previous.rows.length !== rows.length
    )
      throw Error("Checkpoint binding mismatch.");
    previous.rows.forEach((old, i) => {
      const expected = rows[i];
      if (
        !old ||
        old.providerTicker !== expected.providerTicker ||
        old.dataset !== expected.dataset ||
        old.source !== expected.source ||
        old.cost !== expected.cost ||
        !STATUSES.has(old.status) ||
        !(old.testedAt === null || instant(old.testedAt))
      )
        throw Error("Invalid checkpoint row.");
      const s = ["not-tested", "in-flight", "unknown-outcome"].includes(
        old.status,
      )
        ? { status: old.status }
        : summary(old, expected);
      rows[i] = { ...expected, ...s, testedAt: old.testedAt };
      if (old.status === "in-flight") rows[i].status = "unknown-outcome";
    });
  }
  const at = clock;
  let stopReason = null;
  const remaining = {
    EODHD: quota.eodhdRemaining,
    SentiSense: quota.sentisenseRemaining,
  };
  // Keep 10% of each verified remaining allowance outside this run. Reservation
  // must also preserve the server's stronger global/product reserves.
  const caps = {
    EODHD: Math.floor(remaining.EODHD * 0.9),
    SentiSense: Math.floor(remaining.SentiSense * 0.9),
  };
  const spent = { EODHD: 0, SentiSense: 0 };
  const report = () =>
    freeze({
      schema: 1,
      ownerId: auth.userId,
      runId: plan.manifest.runId,
      manifestHash: plan.manifestHash,
      generatedAt: at(),
      scope: "provider-evidence-coverage-only",
      liveVerified: false,
      complete: rows.every((r) => terminal.has(r.status)),
      stopReason,
      costEstimate: plan.cost,
      attemptedThisRun: { ...spent },
      rows: rows.map((r) => ({ ...r })),
    });
  await invoke("checkpoint", report());
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.status !== "not-tested") continue;
    if (spent[row.source] + row.cost > caps[row.source]) {
      stopReason = "budget";
      break;
    }
    const task = freeze({
      ...plan.rows[i],
      ownerId: auth.userId,
      runId: plan.manifest.runId,
      manifestHash: plan.manifestHash,
      from: plan.manifest.from,
      to: plan.manifest.to,
    });
    if ((await invoke("reserve", task)) !== true) {
      stopReason = "budget";
      break;
    }
    spent[row.source] += row.cost;
    rows[i] = { ...row, status: "in-flight", testedAt: at() };
    await invoke("checkpoint", report());
    let outcome;
    try {
      outcome = summary(await deps.read(task), row);
    } catch {
      outcome = { status: "unknown-outcome" };
    }
    rows[i] = { ...row, ...outcome, testedAt: at() };
    if (
      [
        "unknown-outcome",
        "unauthorized",
        "restricted",
        "rate-limited",
        "invalid-evidence",
      ].includes(outcome.status)
    )
      stopReason = outcome.status;
    await invoke("checkpoint", report());
    if (stopReason) break;
  }
  const result = report();
  await invoke("checkpoint", result);
  return result;
}
