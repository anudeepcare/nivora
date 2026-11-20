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

test("phone title wraps the full company name without a clipped listing label", () => {
  assert.match(
    jsx,
    /className=\{headerPaceStyles.mobileName\}>\s*\{r.company.name\}/,
  );
  assert.match(
    jsx,
    /Help label="Company facts and source dates">\s*<p>\s*\{r.company.name}/,
  );
  const mobile = css.slice(css.indexOf("@media (max-width: 700px)"));
  assert.match(
    mobile,
    /\.mobileName\s*\{[^}]*white-space: normal;[^}]*overflow-wrap: anywhere/,
  );
  assert.doesNotMatch(mobile, /text-overflow: ellipsis/);
});
