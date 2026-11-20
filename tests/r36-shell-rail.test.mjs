import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import postcss from "postcss";

test("desktop header, workspace and Research share a bounded rail", () => {
  const css = postcss.parse(
    fs.readFileSync("components/WorkspaceShell.module.css", "utf8"),
  );
  const rules = {};
  css.walkRules((rule) => {
    if (
      rule.parent.type !== "atrule" ||
      rule.parent.params !== "(min-width: 768px)"
    )
      return;
    rules[rule.selector.replace(/\s+/g, " ")] = Object.fromEntries(
      rule.nodes.map(({ prop, value }) => [prop, value]),
    );
  });
  const shell = '.shell[data-appearance="plaid"]';
  const header = rules[shell + " .header"];
  assert.match(header.width, /--workspace-edge/);
  assert.equal(header["max-width"], "var(--workspace-measure)");
  assert.equal(header["border-radius"], "28px");
  assert.equal(header["padding-inline"], "var(--workspace-inset)");
  assert.equal(
    rules[shell + " .workspace"]["max-width"],
    "var(--workspace-measure)",
  );
  assert.equal(
    rules[
      shell +
        '[data-page="research"] .content > :global(.research-page[data-active-lens])'
    ]["--research-gutter"],
    "var(--workspace-inset)",
  );
});
