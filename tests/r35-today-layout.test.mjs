import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = (name) => readFileSync(`components/${name}`, "utf8");

test("holdings spans the dashboard even if a research checkpoint is present", () => {
  assert.match(
    source("HomeWorkspace.module.css"),
    /\.leadGrid > section \{\s*grid-column: 1 \/ -1/,
  );
});

test("single reported quarter uses the available column and retains both sources", () => {
  assert.match(
    source("HomeQuarterHighlights.module.css"),
    /\.grid > article:only-child \{\s*grid-column: 1 \/ -1/,
  );
  assert.match(
    source("HomeQuarterHighlights.module.css"),
    /\.grid:has\(> article:only-child\) \{\s*grid-template-columns: minmax\(0, 1fr\)/,
  );
  assert.match(
    source("HomeQuarterHighlights.tsx"),
    /Latest source.*\n[\s\S]+Prior source/,
  );
});

test("Today groups lower actions together and allows either opened detail to use full width", () => {
  assert.match(
    source("HomeWorkspace.tsx"),
    /className=\{homeStyles.actionGrid\}[\s\S]+<ContributionCompare[\s\S]+<HomeRadar/,
  );
  assert.match(
    source("HomeWorkspace.module.css"),
    /\.actionGrid > [^{]*:has\(> button\[aria-expanded="true"\]\)[^{]*\{\s*grid-column: 1 \/ -1/,
  );
});
