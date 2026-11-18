import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

// Full npm test is unchanged. This packaged-source check explicitly omits only
// the frozen reference-fixture suite whose input artifacts are not distributed.
const excluded = "pace-v7.test.mjs";
console.error(
  `Applicable suite excludes ${excluded}: restricted reference fixtures are not distributed.`,
);
const files = readdirSync("tests")
  .filter((name) => name.endsWith(".test.mjs") && name !== excluded)
  .sort()
  .map((name) => `tests/${name}`);
if (!files.length) throw new Error("No applicable tests found.");
const result = spawnSync(
  process.execPath,
  ["--experimental-strip-types", "--test", ...files],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
