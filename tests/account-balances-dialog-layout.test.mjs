import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("balances component owns its input and checkbox layout without legacy portfolio-page dependency", () => {
  const css = fs.existsSync("components/AccountBalances.module.css")
    ? fs.readFileSync("components/AccountBalances.module.css", "utf8")
    : "";
  assert.match(css, /account-money-input\) input[^}]+border: 0/s);
  assert.match(css, /account-money-input\):focus-within[^}]+outline: 2px/s);
  assert.match(css, /input:focus-visible[^}]+outline: none/s);
  assert.match(
    css,
    /account-balance-confirm\)[^}]+grid-template-columns: 18px minmax\(0, 1fr\)/s,
  );
  assert.match(css, /overflow-y: auto/);
  assert.match(css, /max-height: 85dvh/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
  const source = fs.readFileSync("components/AccountBalances.tsx", "utf8");
  assert.match(
    source,
    /<span>Managed investments are not already in my holdings\.<\/span>/,
  );
});
