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
visit(path.join(root, "lib/accumulation-policy-v5.ts"));
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
  const raw = fs.readFileSync(process.argv[2]);
  const report = runPaceStudy(JSON.parse(raw.toString("utf8")), hash, {
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
