import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("chain and gamma are named and directly selectable without changing default or sorting", () => {
  const research = fs.readFileSync("components/Research.tsx", "utf8"),
    desk = fs.readFileSync("components/OptionsDesk.tsx", "utf8"),
    css = fs.readFileSync("components/OptionsDesk.module.css", "utf8");
  assert.match(research, /title: "Chain, gamma & practice"/);
  const nav = desk.slice(
    desk.indexOf('aria-label="Options sections"'),
    desk.indexOf('aria-label="Advanced options tools"'),
  );
  assert.match(nav, /\["diagnostics", "Volatility & gamma"\]/);
  assert.match(nav, /\["chain", "Calls & puts chain"\]/);
  assert.doesNotMatch(desk, /<option value="diagnostics">/);
  assert.match(desk, /\[view, setView\] = useState\("positioning"\)/);
  assert.match(desk, /onClick=\{\(\) => navigate\(id\)\}/);
  assert.match(css, /\.views button\s*\{[^}]*min-height: 44px/s);
  assert.match(css, /flex: 1 1 140px/);
});
test("final scoped options cascade does not force five long labels into four nowrap columns", () => {
  const css = fs.readFileSync("components/OptionsDesk.module.css", "utf8");
  assert.doesNotMatch(css, /\.desk \.views\s*\{[^}]*flex-wrap: nowrap/s);
  assert.doesNotMatch(
    css,
    /\.desk \.views button\s*\{[^}]*white-space: nowrap/s,
  );
  assert.match(
    css,
    /grid-template-columns: repeat\(auto-fit, minmax\(140px, 1fr\)\)/,
  );
});
