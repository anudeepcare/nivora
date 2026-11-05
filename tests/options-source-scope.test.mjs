import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { normalizeOptions } from "../lib/options-analysis.ts";
const mod = { exports: {} };
const code = ts.transpileModule(
  fs.readFileSync("lib/options-source.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
class HttpError extends Error {}
new Function("require", "module", "exports", code)(
  (name) =>
    ({
      "./alpaca-options": {},
      "./eodhd": {},
      "./options-analysis": { normalizeOptions },
      "./server": { HttpError },
    })[name],
  mod,
  mod.exports,
);
const row = {
  id: "APP280121C00100000",
  standard: true,
  type: "call",
  strike: 100,
  expiry: "2028-01-21",
};
test("option sources reject wrong underlying and inconsistent OCC metadata before account capture or display", () => {
  const check = mod.exports.validateOptionScope;
  assert.equal(check([row], "APP", null)[0], row);
  for (const c of [
    { ...row, id: "MSFT280121C00100000" },
    { ...row, type: "put" },
    { ...row, strike: 101 },
    { ...row, expiry: "2028-01-28" },
    { ...row, id: "invalid" },
  ])
    assert.throws(() => check([c], "APP", null));
  assert.throws(() => check([row], "APP", "2028-01-28"));
});
