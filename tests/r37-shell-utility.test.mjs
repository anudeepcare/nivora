import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import postcss from "postcss";

test("workspace utility controls share the navigation surface without permanent tinted tiles", () => {
  const css = postcss.parse(
    readFileSync("components/WorkspaceShell.module.css", "utf8"),
  );
  const root = '.shell[data-appearance="plaid"] .header .actions ';
  const found = new Map();
  css.walkRules((rule) => {
    if (!rule.selector.startsWith(root)) return;
    rule.walkDecls("background", (decl) =>
      found.set(rule.selector, decl.value),
    );
  });
  assert.equal(found.get(root + ":is(button, a)"), "transparent");
  assert.equal(found.get(root + "button:last-child"), undefined);
  assert.equal(found.get(root + ":is(button, a):hover"), "var(--plaid-ice)");
});
