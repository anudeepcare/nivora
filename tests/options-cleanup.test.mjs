import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
test("open interest uses accessible themed bar rather than native meter colors", () => {
  const source = fs.readFileSync(
    "components/OptionsPositioningOverview.tsx",
    "utf8",
  );
  assert.doesNotMatch(source, /<meter/);
  assert.match(source, /role="meter"/);
  assert.match(source, /aria-valuenow=\{wall.oi\}/);
  const css = fs.readFileSync(
    "components/OptionsPositioningOverview.module.css",
    "utf8",
  );
  assert.match(css, /\.wallMeter[^}]*\{[^}]*background: var\(--blue\)/s);
});
test("market overview opens with real loading state rather than a second browse action", () => {
  const source = fs.readFileSync(
    "components/OptionsMarketOverview.tsx",
    "utf8",
  );
  assert.doesNotMatch(source, /Browse market options|setOpen/);
  assert.match(source, /!preview \? "options-overview" : null/);
});
test("contract coverage message does not point above or expose provider names", () => {
  const source = fs.readFileSync("lib/options-source.ts", "utf8");
  const message = source.match(/message:\s*\n?\s*"([^"]+)"/)[1];
  assert.doesNotMatch(message, /above|SentiSense|EODHD/);
  assert.match(message, /Company positioning/);
});
