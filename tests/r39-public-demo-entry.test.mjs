import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
const read = (p) => fs.readFileSync(p, "utf8");
test("both public demo CTAs document-navigate directly to the account-free walkthrough", () => {
  const opening = read("components/PublicPlaidOpening.tsx");
  const landing = read("components/PublicLanding.tsx");
  assert.match(
    opening,
    /<a className=\{s.demo\} href="\/sample#product-guide">\s*Try the demo/,
  );
  assert.match(
    opening,
    /<a href="\/sample#product-guide" className=\{s.heroCta\}>\s*Explore the demo/,
  );
  assert.match(landing, /id="product-guide"/);
  assert.doesNotMatch(opening, /themeControl/);
  assert.doesNotMatch(landing, /PublicThemeToggle/);
  assert.match(read("components/AppSession.tsx"), /pathname === "\/sample"/);
  assert.match(
    read("app/[[...route]]/page.tsx"),
    /AURYN_ENABLE_PREVIEW[\s\S]+NODE_ENV !== "production"/,
  );
});
test("workspace launch follows app theme without using green legacy gradients", () => {
  const css = read("components/LaunchScreen.module.css");
  assert.match(css, /\.launch\s*\{[\s\S]*?var\(--plaid-canvas/);
  assert.match(css, /\.recovery\s*\{\s*padding-top:/);
});
