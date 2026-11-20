import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import postcss from "postcss";
const css = postcss.parse(
  fs.readFileSync("components/SessionAccess.css", "utf8"),
);
const media = css.nodes.find(
  (n) => n.type === "atrule" && n.params === "(min-width: 901px)",
);
const rules = (selector) =>
  Object.fromEntries(
    media.nodes
      .find((n) => n.selector === selector)
      ?.nodes.map((d) => [d.prop, d.value]) ?? [],
  );
test("desktop login forms one edge-to-edge viewport workspace with full-height branded side", () => {
  assert.equal(
    rules('#auryn-app .mp-auth[data-plaid-page="access"]')["padding"],
    "0",
  );
  assert.equal(
    rules('#auryn-app .mp-auth[data-plaid-page="access"]')[
      "grid-template-rows"
    ],
    "auto minmax(min-content, 1fr)",
  );
  const side = rules(
    '#auryn-app .mp-auth[data-plaid-page="access"] [data-auth-side]',
  );
  assert.equal(side["grid-row"], "1 / -1");
  assert.equal(side["border-radius"], "0");
  const form = rules(
    '#auryn-app .mp-auth[data-plaid-page="access"] .mp-auth-panel',
  );
  assert.equal(form.border, "0");
  assert.equal(form["box-shadow"], "none");
});
