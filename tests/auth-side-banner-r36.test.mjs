import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
test("the legal and account flow keep compact phone layout and the desktop side banner", () => {
  const view = fs.readFileSync("components/Session.tsx", "utf8");
  assert.match(view, /<aside data-auth-side/);
  assert.match(view, /<AuthLegalLinks\s*\/>/);
  assert.doesNotMatch(view, /data-auth-banner|Close sign in|rememberHelp/);
  const css = fs.readFileSync("components/SessionAccess.css", "utf8");
  assert.match(css, /\[data-auth-side\]\s*\{\s*display: none/);
  assert.match(
    css,
    /@media \(min-width: 901px\)[\s\S]*?\[data-auth-side\][\s\S]*?repeating-radial-gradient/,
  );
});
