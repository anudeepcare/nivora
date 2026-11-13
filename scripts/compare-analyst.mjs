import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { compareAnalystSnapshots } from "../lib/analyst-parity.ts";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Exit zero only for a complete, exact, independently dated cohort match. */
export function runComparison(
  argv,
  { expectedCount = 1000, minimumCount = null } = {},
) {
  const [cohortPath, referencePath, actualPath, output, ...options] = argv;
  if (!output)
    throw Error(
      "Usage: node --experimental-strip-types scripts/compare-analyst.mjs cohort.json reference.json actual.json report.json [--expected-count N]",
    );
  if (options.length) {
    if (
      options.length !== 2 ||
      options[0] !== "--expected-count" ||
      !/^[1-9][0-9]*$/.test(options[1])
    )
      throw Error("Only --expected-count with a positive integer is supported");
    expectedCount = Number(options[1]);
  }
  if (expectedCount !== null && !Number.isSafeInteger(expectedCount))
    throw Error("Invalid expected count");
  const inputs = {};
  const read = (name, inputPath) => {
    const bytes = fs.readFileSync(inputPath);
    const rows = JSON.parse(bytes.toString("utf8"));
    if (!Array.isArray(rows)) throw Error(`${name} must be a JSON array`);
    inputs[name] = {
      path: path.relative(process.cwd(), path.resolve(inputPath)),
      sha256: hash(bytes),
      records: rows.length,
    };
    return rows;
  };
  const symbols = read("cohort", cohortPath),
    reference = read("reference", referencePath),
    actual = read("actual", actualPath);
  if (expectedCount !== null && symbols.length !== expectedCount)
    throw Error(
      `Expected exactly ${expectedCount} cohort stocks; received ${symbols.length}`,
    );
  if (minimumCount !== null && symbols.length < minimumCount)
    throw Error(`At least ${minimumCount} unique stocks required`);
  const report = compareAnalystSnapshots(symbols, reference, actual);
  if (report.outOfCohort.reference.length || report.outOfCohort.actual.length)
    throw Error(
      "Observations outside the requested cohort must be audited separately",
    );
  const bytes = JSON.stringify(report, null, 2) + "\n";
  const manifest = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    purpose:
      "Analyst target evidence comparison; no network calls or synthetic target substitution",
    expectedCount: expectedCount ?? symbols.length,
    inputs,
    output: {
      path: path.relative(process.cwd(), path.resolve(output)),
      sha256: hash(bytes),
      records: report.rows.length,
    },
    strictPass: report.completeExactMatch,
    outcome: report.completeExactMatch
      ? "passed"
      : report.compared < report.requested ||
          report.fullTriples.revisionVerified < report.requested
        ? "incomplete"
        : "mismatch",
    evidence: {
      requested: report.requested,
      completeComparablePairs: report.compared,
      fullTriplePairs: report.fullTriples.compared,
      consensusPairs: report.consensus.compared,
      targetRevisionVerifiedTriplePairs: report.fullTriples.revisionVerified,
      statusCounts: report.statusCounts,
    },
    metricDefinitions: {
      agreement:
        "Legacy exact matches / entire cohort; not comparable-pair agreement",
      pairAgreement:
        "Exact matches including target analyst count / complete comparable pairs; null when no pairs",
      coverage: "Complete comparable pairs / requested cohort",
      fullTriples:
        "Low, consensus, high and same settled-close value; does not require an analyst count",
      consensus:
        "Consensus and same settled-close value only; cannot establish low/high parity",
      targetDates:
        "Same capture day permits observation-only comparisons; strictPass additionally requires equal explicit target revision dates on every pair",
    },
  };
  fs.writeFileSync(output, bytes);
  fs.writeFileSync(
    `${output}.manifest.json`,
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      ...report,
      rows: undefined,
      strictPass: manifest.strictPass,
      outcome: manifest.outcome,
      manifest: `${output}.manifest.json`,
    }),
  );
  return report.completeExactMatch ? 0 : 1;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.exitCode = runComparison(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
