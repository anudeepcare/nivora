import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("valuation API is an authenticated bounded stored-output read", () => {
  const source = fs.readFileSync("app/api/valuation/[symbol]/route.ts", "utf8");
  assert.match(source, /account\(request\)/);
  assert.match(source, /symbolInput/);
  assert.match(source, /limit\(`/);
  assert.match(source, /\.limit\(1\)/);
  assert.match(source, /privateJson/);
  assert.doesNotMatch(source, /research\(/);
  assert.doesNotMatch(source, /Promise\.all/);
});
