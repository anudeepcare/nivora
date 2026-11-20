import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import postcss from "postcss";
const css = postcss.parse(
  readFileSync("components/LegalDocument.module.css", "utf8"),
);
const ruleFor = (selector) =>
  css.nodes.find((rule) => rule.selector === selector);
const value = (rule, prop) =>
  rule?.nodes.find((decl) => decl.prop === prop)?.value;
test("legal brand, navigation and reader share a single nonsticky full-width column", () => {
  const column = ruleFor(".document[data-document]");
  assert.equal(value(column, "grid-template-columns"), "minmax(0, 1fr)");
  const alignment = ruleFor(
    ":global(#auryn-app) .document[data-document] > header,\n:global(#auryn-app) .document[data-document] > :global(.document-layout),\n:global(#auryn-app) .document[data-document] :global(.document-layout) > nav,\n:global(#auryn-app) .document[data-document] :global(.document-reading)",
  );
  assert.equal(value(alignment, "width"), "100%");
  assert.equal(value(alignment, "max-width"), "none");
  assert.equal(value(alignment, "position"), "static");
  assert.equal(value(alignment, "box-sizing"), "border-box");
});
test("both base and dark document palettes have readable body text", () => {
  const theme = postcss.parse(readFileSync("app/core/plaid-theme.css", "utf8"));
  const hex = (v) => v.match(/\w\w/g).map((x) => parseInt(x, 16) / 255);
  const luminance = (v) =>
    hex(v)
      .map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
      .reduce((a, x, i) => a + x * [0.2126, 0.7152, 0.0722][i], 0);
  for (const selector of [":root", 'html[data-theme="dark"]']) {
    const t = theme.nodes.find((r) => r.selector === selector);
    const [a, b] = ["--plaid-muted", "--plaid-surface"].map((p) =>
      luminance(value(t, p)),
    );
    assert.ok(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5,
      selector,
    );
  }
  assert.match(css.toString(), /color: var\(--plaid-muted/);
});
