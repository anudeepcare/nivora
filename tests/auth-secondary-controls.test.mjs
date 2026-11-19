import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const css = () => fs.readFileSync("components/Session.module.css", "utf8");
test("auth owns link-button reset and44px password toggle independently of legacy CSS", () => {
  const s = css();
  assert.match(
    s,
    /\.auth \.main :global\(\.mp-inline-link\)\s*\{[^}]*background:\s*transparent[^}]*border:\s*0/s,
  );
  assert.match(
    s,
    /\.auth \.main :global\(\.mp-password-field\)\s*\{[^}]*position:\s*relative/s,
  );
  assert.match(
    s,
    /\.auth \.main :global\(\.mp-password-field\) > button\s*\{[^}]*position:\s*absolute[^}]*width:\s*44px[^}]*height:\s*44px/s,
  );
  assert.match(
    s,
    /\.auth \.main :global\(\.mp-password-field\) svg\s*\{[^}]*width:\s*20px[^}]*height:\s*20px/s,
  );
});
test("password eye has intrinsic dimensions while preserving accessible toggle semantics and form action separation", () => {
  const s = fs.readFileSync("components/Session.tsx", "utf8");
  const eye = s.slice(
    s.indexOf('showPassword ? "Hide password"'),
    s.indexOf("{showPassword && <path"),
  );
  assert.match(eye, /aria-pressed=\{!!showPassword\}/);
  assert.match(eye, /onClick=\{\(\) => setShowPassword\(!showPassword\)\}/);
  assert.match(eye, /<svg\s+width="20"\s+height="20"/);
  assert.match(s, /className="mp-inline-link"\s+type="button"/);
});
