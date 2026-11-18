import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (file) => fs.readFileSync("components/" + file, "utf8");
test("phone company facts remain available with inline identity metadata rather than hidden legacy context", () => {
  const source = read("Research.tsx");
  assert.match(source, /className=\{cockpit.identityMeta\}/);
  assert.doesNotMatch(source, /className="security-context"/);
  const row = source.slice(
    source.indexOf("className={cockpit.identityMeta}"),
    source.indexOf("className={experience.stockPrice}"),
  );
  assert.match(row, /Company facts and source dates/);
  assert.match(row, /StockFacts/);
  const css = read("ReferenceCockpit.module.css");
  assert.match(css, /\.identityMeta[\s\S]*flex-wrap: wrap/);
});
test("small Research viewport shrinks identity and puts bounded real Atlas readings before narrative", () => {
  const header = read("IntegratedExperience.module.css");
  assert.match(header, /\.stockIdentity > div\s*\{\s*min-width: 0/);
  const atlas = read("ReferenceAtlas.module.css");
  assert.match(atlas, /@media \(max-width: 430px\)/);
  assert.match(atlas, /\.graphic\s*\{\s*order: 0/);
  assert.match(atlas, /width: 60px;\s*margin-left: -30px/);
  assert.match(atlas, /\.caseGrid strong\s*\{\s*overflow-wrap: anywhere/);
});
test("Business financial figures precede secondary analysis navigation", () => {
  const s = read("Research.tsx");
  const b = s.slice(
    s.indexOf('{tab === "Financials" && ('),
    s.indexOf('{tab === "Valuation"'),
  );
  assert.ok(b.indexOf("<Financials") < b.indexOf("<ResearchWorkspace"));
  assert.match(b, /<BusinessHistory/);
  assert.match(b, /<FinancingContext/);
});

test("option wall columns fit a narrow phone content area without fixed 245px plus gaps", () => {
  const css = read("OptionsPositioningOverview.module.css");
  assert.match(
    css,
    /@media \(max-width: 420px\)[\s\S]*grid-template-columns: 70px minmax\(0, 1fr\) 60px/,
  );
});
