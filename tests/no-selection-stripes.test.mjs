import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";

test("selected or expanded admin rows use a surface fill rather than an edge stripe", () => {
  for (const [name, selector] of [
    ["OwnerHandbook", '.topics a[aria-current="location"]'],
    ["SupportInbox", ".ticket[open]"],
  ]) {
    let hasFill = false;
    const css = fs.readFileSync(`components/${name}.module.css`, "utf8");
    postcss.parse(css).walkRules((rule) => {
      if (rule.selector !== selector) return;
      rule.walkDecls((d) => {
        if (d.prop === "background") hasFill = true;
        if (d.prop === "box-shadow")
          assert.doesNotMatch(d.value, /\binset\s+[1-9]\d*px\s+0(?:\s|$)/);
      });
    });
    assert.ok(hasFill, `${name} should still visibly mark the state`);
  }
});

test("company search has no separator above the focused input", () => {
  const dialog = fs.readFileSync(
    "components/WorkspaceShell.module.css",
    "utf8",
  );
  const field = fs.readFileSync("components/Search.module.css", "utf8");
  assert.match(
    dialog,
    /\.searchDialog > :global\(\.dialog-head\)\s*\{\s*border-bottom: 0;/,
  );
  assert.match(field, /\.search-box\):focus-within\s*\{[^}]*border-color:/s);
});
