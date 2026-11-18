import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
test("inactive heavy research evidence modules are dynamic import boundaries, not initial static imports", () => {
  const source = fs.readFileSync("components/Research.tsx", "utf8");
  const ast = ts.createSourceFile(
    "Research.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const staticImports = ast.statements
    .filter(ts.isImportDeclaration)
    .map((n) => n.moduleSpecifier.text);
  for (const name of [
    "SentiSensePanels",
    "DirectResearchLenses",
    "ResearchDetails",
    "DecisionWorkspace",
    "DecisionWatch",
    "TimingContext",
    "OwnershipPicture",
    "Analyst",
    "OptionsDesk",
    "OptionsMarketOverview",
  ]) {
    assert.ok(
      !staticImports.includes("./" + name),
      name + " must not load eagerly",
    );
    assert.ok(
      source.includes('import("./' + name + '")'),
      name + " remains reachable",
    );
  }
  assert.match(source, /loading: \(\) => <p role="status">Opening evidence/);
  assert.match(source, /label="Options research"/);
  assert.match(source, /title: "Positioning & history"/);
  assert.match(source, /title: "Contract tools & practice"/);
  assert.doesNotMatch(source, /initialSelection=\{-1\}/);
});
test("supplemental quote REST and stream wait for initial research evidence", () => {
  const source = fs.readFileSync("components/Research.tsx", "utf8");
  assert.match(
    source,
    /baseResearch\s*\? `quotes\?symbols=\$\{encodeURIComponent\(symbol\)\}`\s*:\s*null/,
  );
  assert.match(
    source,
    /useLivePrices\(\[symbol\], !!demo \|\| !baseResearch\)/,
  );
  assert.match(source, /if \(demo \|\| !baseResearch\) return/);
  assert.match(
    source,
    /retainResearchQuote\(priorQuote, baseResearch\?\.quote\)/,
  );
});
