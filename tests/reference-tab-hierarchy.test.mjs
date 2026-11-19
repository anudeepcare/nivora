import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync("app/core/reference-tabs.css", "utf8");

test("section tabs show a slim active underline without a filled box", () => {
  assert.match(css, /\.auryn-view-tabs\s*\{[^}]*border-bottom:/s);
  assert.match(
    css,
    /\.auryn-view-tabs[^{}]*\[aria-pressed="true"\][^{}]*\{[^}]*inset 0 -2px 0 var\(--view-tab-accent\)/s,
  );
});

test("detail tabs use a quiet pill with no enclosing box or raised shadow", () => {
  assert.match(css, /\.auryn-detail-tabs\s*\{[^}]*border: 0/s);
  assert.match(
    css,
    /\.auryn-detail-tabs[^{}]*\[aria-pressed="true"\][^{}]*\{[^}]*border-radius: 999px;[^}]*background:/s,
  );
});

test("the tab styles ship with the real app and apply to watchlist and Portfolio chart controls", () => {
  assert.match(
    fs.readFileSync("app/layout.tsx", "utf8"),
    /reference-tabs\.css/,
  );
  for (const file of ["WatchlistPage", "PortfolioCharts"]) {
    assert.match(
      fs.readFileSync(`components/${file}.tsx`, "utf8"),
      /auryn-detail-tabs/,
    );
  }
});

test("inline Pace and option selectors use the same quiet selection without shifting their toolbars", () => {
  for (const [file, label] of [
    ["AccumulationDesk", "Accumulation time horizon"],
    ["OptionsDesk", "Contract type"],
  ]) {
    assert.match(
      fs.readFileSync(`components/${file}.tsx`, "utf8"),
      new RegExp(
        `auryn-detail-tabs auryn-tab-inline"\\s+aria-label="${label}"`,
      ),
    );
  }
  assert.match(css, /\.auryn-tab-inline\s*\{[^}]*margin-block: 0/s);
});
