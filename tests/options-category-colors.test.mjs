import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("call and put volume and OI share distinct categorical tokens and visible side labels", () => {
  const ui = readFileSync("components/OptionsPositioningOverview.tsx", "utf8");
  const css = readFileSync(
    "components/OptionsPositioningOverview.module.css",
    "utf8",
  );
  assert.match(ui, /className=\{styles\.legend\}/);
  assert.match(ui, /data-side="Call"/);
  assert.match(ui, /data-side="Put"/);
  assert.match(ui, /data-side=\{wall\.side\}/);
  assert.match(ui, /Colors distinguish contract types, not trade direction/);
  assert.match(css, /--option-call: #2563b8/);
  assert.match(css, /--option-put: #a65b0b/);
  assert.match(css, /\.wall\[data-side="Put"\] \.wallMeter > span/);
  assert.match(css, /:global\(\[data-theme="dark"\]\) \.root/);
});
