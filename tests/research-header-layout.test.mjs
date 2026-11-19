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

test("Pace is next to company details and never inside the quote", () => {
  const loaded = jsx.slice(jsx.indexOf("<article"));
  const pace = loaded.indexOf('Help label="this Pace reading"');
  const identity = loaded.indexOf("cockpit.identityMeta");
  const quote = loaded.indexOf("headerPaceStyles.price}");
  assert.ok(identity >= 0 && identity < pace && pace < quote);
  assert.match(
    loaded.slice(identity, quote),
    /headerPaceStyles\.paceStatus[\s\S]*headerPaceStyles\.paceLevel/,
  );
  assert.doesNotMatch(css, /\.badge\b/);
});
