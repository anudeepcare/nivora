#!/usr/bin/env node
/** Full enabled-directory audit. Credentials come only from the process env.
 * Run with --mode=full to test datasets, --resume=file.json across budget windows.
 * The default directory pass does not equate catalog presence to data entitlement. */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const FEATURE_NAMES = [
  "quote",
  "history",
  "profile",
  "fundamentals",
  "filings",
  "estimates",
  "earnings",
  "pace",
  "news",
];
const budgetFailure = (value) =>
  /budget|allowance|request limit|temporarily paused|reserved for this minute/i.test(
    String(value ?? ""),
  );
const STATES = [
  "available",
  "partial",
  "unavailable",
  "not-applicable",
  "not-tested",
];
const untouched = () =>
  Object.fromEntries(
    FEATURE_NAMES.map((feature) => [
      feature,
      {
        status: "not-tested",
        reason: "Dataset has not been tested in this audit.",
      },
    ]),
  );
function counts(records) {
  return Object.fromEntries(
    FEATURE_NAMES.map((feature) => [
      feature,
      Object.fromEntries(
        STATES.map((state) => [
          state,
          records.filter((r) => r.features[feature]?.status === state).length,
        ]),
      ),
    ]),
  );
}
/** All directory rows receive a record, including those awaiting a later budget
 * window. A resume preserves completed rows with their original testedAt. */
export async function auditUniverse(
  {
    directory,
    research,
    news,
    filings,
    pace,
    shouldStop = () => false,
    checkpoint,
  },
  previous,
) {
  const old = new Map(
    (previous?.records ?? [])
      .filter((r) => r.tested && r.completed)
      .map((r) => [r.symbol, r]),
  );
  const records = [];
  let limited = directory.directories.some(
    (d) => d.status === "unavailable" && budgetFailure(d.reason),
  );
  const stopped = () => limited || shouldStop();
  const report = {
    schemaVersion: 1,
    scope:
      "Active US-listed USD equities and USD crypto pairs; provider catalog presence is not proof of dataset entitlement.",
    generatedAt: new Date().toISOString(),
    discoveryComplete: directory.complete,
    universeSize: directory.complete ? directory.listings.length : null,
    knownListings: directory.listings.length,
    directories: directory.directories,
    tested: 0,
    completed: 0,
    features: {},
    records,
  };
  for (const listing of directory.listings) {
    if (old.has(listing.symbol)) {
      records.push(old.get(listing.symbol));
      continue;
    }
    const record = {
      symbol: listing.symbol,
      name: listing.name,
      exchange: listing.exchange,
      currency: listing.currency,
      assetType: listing.assetType,
      tested: false,
      completed: false,
      features: untouched(),
    };
    if (research && !stopped()) {
      record.tested = true;
      record.testedAt = new Date().toISOString();
      try {
        const r = await research(listing.symbol);
        if (r.issues?.some(budgetFailure)) limited = true;
        Object.assign(record.features, r.coverage ?? {});
        const crypto = listing.assetType === "crypto";
        for (const feature of ["estimates", "earnings"])
          record.features[feature] = {
            status: crypto
              ? "not-applicable"
              : r.evidence?.[feature]?.length
                ? "available"
                : "unavailable",
            reason: crypto
              ? "Corporate estimates and earnings do not apply to crypto."
              : undefined,
          };
        if (pace) {
          const p = pace(
            r.history,
            record.testedAt,
            crypto ? "crypto" : "us-equity",
          );
          record.features.pace = {
            status: p.confirmed
              ? "available"
              : p.forming
                ? "partial"
                : "unavailable",
            reason: p.reason,
          };
        }
        if (
          filings &&
          !crypto &&
          record.features.filings.status !== "available" &&
          !stopped()
        ) {
          try {
            const f = await filings(listing.symbol);
            record.features.filings = {
              status: f.filings?.length
                ? f.issues?.length
                  ? "partial"
                  : "available"
                : "unavailable",
              asOf: f.filings?.[0]?.date,
              reason: f.issues?.join(" ") || undefined,
            };
          } catch (error) {
            if (error?.status === 429 || budgetFailure(error?.message))
              limited = true;
            record.features.filings = {
              status: "unavailable",
              reason:
                "The independent filing source did not return a usable response.",
            };
          }
        }
        if (news && !stopped()) {
          try {
            const n = await news(listing.symbol);
            record.features.news = {
              status: n.items?.length ? "available" : "unavailable",
              source: n.source,
              reason: n.items?.length
                ? undefined
                : "No usable publisher items were returned.",
            };
          } catch (error) {
            if (error?.status === 429 || budgetFailure(error?.message))
              limited = true;
            record.features.news = {
              status: "unavailable",
              reason: "News source did not return a usable response.",
            };
          }
        }
        record.issues = r.issues;
      } catch (error) {
        if (error?.status === 429 || budgetFailure(error?.message))
          limited = true;
        record.failure = {
          status: Number.isInteger(error?.status) ? error.status : null,
          reason:
            error?.status === 404
              ? "Instrument not found by all attempted market sources."
              : "Research source failed or is temporarily unavailable.",
        };
        for (const feature of [
          "quote",
          "history",
          "profile",
          "fundamentals",
          "filings",
        ])
          record.features[feature] = {
            status: "unavailable",
            reason: record.failure.reason,
          };
      }
      record.completed = !stopped();
      if (!record.completed)
        for (const [key, value] of Object.entries(record.features))
          if (value.status === "unavailable")
            record.features[key] = {
              status: "not-tested",
              reason:
                "Audit budget or provider limit interrupted this dataset; retry on resume.",
            };
    }
    records.push(record);
    if (checkpoint && records.length % 25 === 0)
      await checkpoint({
        ...report,
        tested: records.filter((r) => r.tested).length,
        completed: records.filter((r) => r.completed).length,
        features: counts(records),
      });
  }
  report.tested = records.filter((r) => r.tested).length;
  report.completed = records.filter((r) => r.completed).length;
  report.features = counts(records);
  report.interrupted = stopped();
  return report;
}

async function main() {
  const flags = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const at = arg.indexOf("=");
      return [
        arg.slice(0, at < 0 ? undefined : at).replace(/^--/, ""),
        at < 0 ? true : arg.slice(at + 1),
      ];
    }),
  );
  if (flags.help) {
    console.log(
      "node --experimental-strip-types scripts/audit-market-coverage.mjs --mode=directory|full --output=verification/market-coverage.json --max-credits=250 [--resume=previous.json]",
    );
    return;
  }
  const mode = flags.mode ?? "directory";
  if (!["directory", "full"].includes(mode))
    throw Error("Mode must be directory or full.");
  const maxCredits = Number(flags["max-credits"] ?? 250);
  if (!Number.isInteger(maxCredits) || maxCredits < 1 || maxCredits > 8000)
    throw Error("max-credits must be an integer from 1 through 8000.");
  const output = path.resolve(
    String(flags.output ?? "verification/market-coverage.json"),
  );
  const configured = {
    eodhd: Boolean(process.env.EODHD_API_KEY || process.env.EODHD_API_TOKEN),
    twelve: Boolean(process.env.TWELVE_DATA_API_KEY),
    sec: Boolean(
      process.env.SEC_USER_AGENT &&
        !process.env.SEC_USER_AGENT.includes("example.com"),
    ),
  };
  // This source loader evaluates the real adapters without Next build artifacts.
  // Only its TypeScript loader is used; no fixture environment or fake HTTP calls.
  const { sourceModule } = await import(
    "../tests/helpers/provider-fixture.mjs"
  );
  const { eodCallCost } = sourceModule("lib/market-policy.ts");
  let spent = 0,
    requests = 0,
    stopped = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    const eod = url.hostname === "eodhd.com",
      twelve = url.hostname === "api.twelvedata.com";
    const cost = eod
      ? eodCallCost(
          url.pathname.replace(/^\/api\//, ""),
          Object.fromEntries(url.searchParams),
        )
      : twelve
        ? url.pathname === "/profile"
          ? 10
          : 1
        : 0;
    if ((eod || twelve) && spent + cost > maxCredits) {
      stopped = true;
      throw Error("Audit credit ceiling reached.");
    }
    spent += cost;
    requests++;
    const response = await originalFetch(input, options);
    if ((eod || twelve) && [402, 429].includes(response.status)) stopped = true;
    return response;
  };
  const save = async (report) => {
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(
      output + ".tmp",
      JSON.stringify(
        {
          ...report,
          mode,
          configured,
          auditBudget: {
            ceiling: maxCredits,
            estimatedCredits: spent,
            requests,
            stopped,
          },
        },
        null,
        2,
      ) + "\n",
    );
    await fs.rename(output + ".tmp", output);
  };
  try {
    const providers = sourceModule("lib/providers.ts");
    const directory = await providers.marketDirectory();
    const previous = flags.resume
      ? JSON.parse(await fs.readFile(String(flags.resume), "utf8"))
      : undefined;
    const { researchAccumulation } = sourceModule(
      "lib/accumulation-policy-v5.ts",
    );
    const { eodNews, eodFilings } = sourceModule("lib/eodhd.ts");
    const report = await auditUniverse(
      {
        directory,
        research: mode === "full" ? providers.research : undefined,
        news: mode === "full" && configured.eodhd ? eodNews : undefined,
        filings: mode === "full" && configured.eodhd ? eodFilings : undefined,
        pace: researchAccumulation,
        shouldStop: () => stopped,
        checkpoint: save,
      },
      previous,
    );
    await save(report);
    console.log(
      JSON.stringify({
        output,
        mode,
        configured,
        universeSize: report.universeSize,
        knownListings: report.knownListings,
        discoveryComplete: report.discoveryComplete,
        tested: report.tested,
        completed: report.completed,
        estimatedCredits: spent,
        stopped,
      }),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  main().catch(() => {
    console.error(
      "Coverage audit could not finish. Check configuration, file arguments and provider access. No credentials were printed.",
    );
    process.exitCode = 1;
  });
