// Backward-compatible entry point. Prefer compare-analyst.mjs (exactly 1,000 by default).
import { runComparison } from "./compare-analyst.mjs";
try {
  process.exitCode = runComparison(process.argv.slice(2), {
    expectedCount: null,
    minimumCount: 500,
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
