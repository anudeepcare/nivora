import test from "node:test";
import assert from "node:assert/strict";
import { safeLogoUrl } from "../lib/logo-policy.ts";

test("logo images require an HTTPS provider host without embedded credentials", () => {
  assert.equal(
    safeLogoUrl("https://static2.finnhub.io/file/publicdatany/a.png"),
    "https://static2.finnhub.io/file/publicdatany/a.png",
  );
  for (const url of [
    "http://static2.finnhub.io/a.png",
    "https://static2.finnhub.io.attacker.invalid/a.png",
    "https://attacker.invalid/a.png",
    "https://user:password@static2.finnhub.io/a.png",
    "data:image/svg+xml,test",
    null,
  ])
    assert.equal(safeLogoUrl(url), null);
});
