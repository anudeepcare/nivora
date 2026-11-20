import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (name) =>
  readFileSync(new URL(`../components/${name}`, import.meta.url), "utf8");
test("Settings reserves a full row for identity and keeps long email on one line", () => {
  const css = read("SettingsPage.module.css");
  assert.match(css, /"account account"/);
  assert.match(
    css,
    /workspace-account-row\) strong\s*\{[^}]*white-space: nowrap/s,
  );
  assert.match(
    css,
    /workspace-account-row\) strong\s*\{[^}]*text-overflow: ellipsis/s,
  );
  assert.match(
    read("SupportingViews.tsx"),
    /<strong title=\{email\}>\{email\}<\/strong>/,
  );
});
test("desktop settings puts shortcuts beside the start of preferences, not below the last section", () => {
  assert.match(read("SettingsPage.module.css"), /"preferences support"/);
});
