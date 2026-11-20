import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (name) => fs.readFileSync(`components/${name}`, "utf8");
test("analyst profile keeps provenance and target-unit caveats in one accessible disclosure", () => {
  const view = read("NamedAnalystProfiles.tsx");
  assert.match(
    view,
    /<summary>Coverage &amp; target notes<\/summary>[\s\S]*?currency is not supplied[\s\S]*?not returns[\s\S]*?<\/details>/,
  );
  assert.match(view, /<time[\s\S]*?retrievedAt/);
  assert.match(view, /f.recent/);
  assert.match(view, /most recently published under this firm/);
});
test("separate target model evidence retains source note without a standalone prose row", () => {
  const view = read("TargetsEstimates.tsx");
  assert.match(
    view,
    /<summary>Sources &amp; reporting periods<\/summary>[\s\S]*?not merged with the consensus\s+feed/,
  );
  assert.doesNotMatch(
    read("Research.tsx"),
    /Separate source coverage and reporting periods/,
  );
  assert.match(view, /aria-selected=\{active === index\}/);
});
