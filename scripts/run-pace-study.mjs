import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { runPaceStudy } from "../lib/pace-study.ts";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const seen = new Set();
function visit(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const source = fs.readFileSync(file, "utf8");
  for (const m of source.matchAll(
    /(?:from\s*|import\s*)["'](\.\.?\/[^"']+)["']/g,
  )) {
    const base = path.resolve(path.dirname(file), m[1]);
    const resolved = [base, base + ".ts", base + ".tsx"].find(
      (p) => fs.existsSync(p) && fs.statSync(p).isFile(),
    );
    if (resolved) visit(resolved);
  }
}
const hashOnly = process.argv[2] === "--policy-hash";
const raw =
  !hashOnly && process.argv[2] ? fs.readFileSync(process.argv[2]) : null;
const input = raw ? JSON.parse(raw.toString("utf8")) : null;
const policyVersion = hashOnly
  ? (process.argv[3] ?? "monthly-v5")
  : input?.policyVersion;
if (!["monthly-v5", "monthly-v6"].includes(policyVersion))
  throw Error("Choose monthly-v5 or monthly-v6 policy.");
visit(
  path.join(
    root,
    policyVersion === "monthly-v6"
      ? "lib/accumulation-policy-v6.ts"
      : "lib/accumulation-policy-v5.ts",
  ),
);
const hash = createHash("sha256")
  .update(
    JSON.stringify(
      [...seen]
        .sort()
        .map((p) => [path.relative(root, p), fs.readFileSync(p, "utf8")]),
    ),
  )
  .digest("hex");
if (process.argv[2] === "--policy-hash") {
  console.log(hash);
} else {
  if (!process.argv[2])
    throw Error(
      "Usage: node --experimental-strip-types scripts/run-pace-study.mjs INPUT.json [OUTPUT.json] | --policy-hash",
    );
  const report = runPaceStudy(input, hash, {
    requireReplay: true,
  });
  visit(path.join(root, "lib/pace-study.ts"));
  visit(path.join(root, "scripts/run-pace-study.mjs"));
  const runnerSourceSha256 = createHash("sha256")
    .update(
      JSON.stringify(
        [...seen]
          .sort()
          .map((p) => [path.relative(root, p), fs.readFileSync(p, "utf8")]),
      ),
    )
    .digest("hex");
  const output =
    JSON.stringify(
      {
        ...report,
        runnerSourceSha256,
        inputSha256: createHash("sha256").update(raw).digest("hex"),
      },
      null,
      2,
    ) + "\n";
  if (process.argv[3])
    fs.writeFileSync(process.argv[3], output, { flag: "wx" });
  else process.stdout.write(output);
}
