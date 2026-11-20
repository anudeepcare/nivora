import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (name) => fs.readFileSync(`components/${name}`, "utf8");
test("Today stacks actual priorities and attention without stretching empty boxes", () => {
  const source = read("HomeWorkspace.tsx");
  assert.match(source, /className=\{homeStyles.attentionColumn\}/);
  const column = source.slice(
    source.indexOf("className={homeStyles.attentionColumn}"),
    source.indexOf("<HomeMarketCards"),
  );
  assert.match(
    source.slice(0, source.indexOf("className={homeStyles.attentionColumn}")),
    /aria-label="Today’s story"/,
  );
  assert.match(column, /<ResearchInbox/);
  assert.match(column, /event.date <= day/);
  assert.match(
    read("HomeWorkspace.module.css"),
    /\.dayOverview\s*\{[^}]*align-items:\s*start/s,
  );
});
test("holdings use inline shared-scale bars with explicit dates, no four-line mover stacks", () => {
  const css = read("PortfolioDay.module.css");
  assert.match(
    css,
    /\.contributionBar\s*\{[^}]*grid-column:\s*2[^}]*grid-row:\s*1/s,
  );
  assert.match(css, /\.observed\s*\{[^}]*grid-column:\s*1\s*\/\s*3/s);
  assert.match(css, /@container holdings-snapshot/);
  assert.match(read("PortfolioDay.tsx"), /className=\{s.changePercent\}/);
});
