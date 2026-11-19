import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css = fs.readFileSync("components/ResearchHeaderPace.module.css", "utf8");
const jsx = fs.readFileSync("components/Research.tsx", "utf8");

test("the loaded header puts the right-aligned desktop quote beside the bookmark", () => {
  const loaded = jsx.slice(jsx.indexOf("<article"));
  assert.match(
    loaded,
    /<header\s+className={`\${experience.stockHeader} \${headerPaceStyles.header}`}/,
  );
  assert.match(css, /grid-template-areas: "identity price watch"/);
  assert.match(
    css,
    /\.price\.price\s*\{[^}]*justify-self: end;[^}]*text-align: right;/,
  );
  assert.match(css, /\.priceMetrics\s*\{[^}]*flex-direction: column;/);
});

test("phone puts bookmark in the company row and keeps the full quote row left aligned", () => {
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"));
  assert.match(
    mobile,
    /grid-template-areas:\s*"identity watch"\s*"price price"/,
  );
  assert.match(mobile, /\.price\.price\s*\{[^}]*text-align: left;/);
  assert.match(
    mobile,
    /\.priceMetrics\s*\{[^}]*flex-direction: row;[^}]*flex-wrap: wrap;/,
  );
});

test("Pace uses the same reading on both sizes with exactly one visible instance", () => {
  const loaded = jsx.slice(jsx.indexOf("<article"));
  const identity = loaded.indexOf("cockpit.identityMeta");
  const desktopPace = loaded.indexOf("headerPaceStyles.paceDesktop");
  const quote = loaded.indexOf("headerPaceStyles.price}");
  const mobilePace = loaded.indexOf("headerPaceStyles.paceMobile");
  const stamp = loaded.indexOf("<DataStamp");
  assert.ok(identity >= 0 && identity < desktopPace && desktopPace < quote);
  assert.ok(quote < mobilePace && mobilePace < stamp);
  assert.match(css, /\.paceMobile\s*\{[^}]*display: none/);
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"));
  assert.match(mobile, /\.paceDesktop\s*\{[^}]*display: none/);
  assert.match(mobile, /\.paceMobile\s*\{[^}]*display: flex/);
  assert.match(
    mobile,
    /\.quote\.quote\s*\{[^}]*flex-direction: row;[^}]*flex-wrap: wrap/,
  );
  assert.doesNotMatch(css, /\.badge\b/);
});

test("mobile title stays on one line and the full name stays available", () => {
  assert.match(jsx, /headerPaceStyles\.mobileName/);
  assert.match(
    jsx,
    /Help label="Company facts and source dates">\s*<p>\s*\{r.company.name}/,
  );
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"));
  assert.match(
    mobile,
    /\.mobileName\s*\{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis/,
  );
});

test("mobile removes the extra listing suffix without hardcoding the example ticker", async () => {
  const { default: ts } = await import("typescript");
  const ast = ts.createSourceFile(
    "Research.tsx",
    jsx,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let expression;
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(ast) === "mobileCompanyName"
    )
      expression = node.initializer.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(expression);
  const label = new Function("r", "return " + expression);
  assert.equal(
    label({ company: { name: "Credo Technology Group Holding Ltd" } }),
    "Credo Technology Group",
  );
  assert.equal(
    label({ company: { name: "Bloom Energy Corp" } }),
    "Bloom Energy",
  );
  assert.equal(label({ company: { name: "Bitcoin" } }), "Bitcoin");
});
