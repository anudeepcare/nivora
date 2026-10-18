import test from "node:test";
import assert from "node:assert/strict";
import config from "../next.config.ts";
test("older installed PWA start URLs and saved stock links redirect into the current workspace", async () => {
  assert.equal(typeof config.redirects, "function");
  const rows = await config.redirects();
  for (const [source, destination] of [
    ["/analyze", "/research"],
    ["/stock/:symbol", "/research/:symbol"],
    ["/home", "/overview"],
    ["/personalization", "/settings"],
  ]) {
    const rule = rows.find((r) => r.source === source);
    assert.ok(rule);
    assert.equal(rule.destination, destination);
  }
});
