import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const source = fs.readFileSync("components/PortfolioPage.tsx", "utf8");
const css = fs.readFileSync("components/PortfolioWorkspace.module.css", "utf8");
test("portfolio read precedes a full-width chart rather than competing in a giant side card", () => {
  assert.ok(
    source.indexOf('aria-label="Your portfolio read"') <
      source.indexOf("<ApprovedPortfolioChart"),
  );
  assert.match(
    css,
    /\.portfolio :global\(\.portfolio-trend-panel\)\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  );
});
test("secondary decision analysis is mounted only when opened", () => {
  assert.match(source, /decisionOpen && \(/);
  assert.match(source, /setDecisionOpen\(event\.currentTarget\.open\)/);
});
test("portfolio refresh uses a styled accessible control", () => {
  assert.match(
    source,
    /className="icon-button"\s+type="button"\s+disabled=\{quotes.loading\}/,
  );
});

test("initial portfolio does not launch research scans until the user requests Pace", () => {
  assert.match(
    source,
    /\[paceRequested, setPaceRequested\] = useState\(false\)/,
  );
  assert.match(source, /useWorkspaceData\("portfolio", paceRequested\)/);
  assert.match(source, /Check Pace/);
});
