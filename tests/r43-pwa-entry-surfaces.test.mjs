import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function phoneStyles(file, selector) {
  const declarations = {};
  postcss.parse(read(file)).walkRules(selector, (rule) => {
    if (
      rule.parent.type !== "atrule" ||
      !rule.parent.params.includes("max-width: 760px")
    )
      return;
    for (const { prop, value } of rule.nodes)
      if (prop) declarations[prop] = value;
  });
  return declarations;
}

test("phone public entry uses one opaque status and navigation plane, with contour artwork only on the navy hero", () => {
  const file = "components/PublicPlaidOpening.module.css";
  const opening = phoneStyles(file, ".opening.opening");
  const hero = phoneStyles(file, ".hero");
  assert.equal(opening.background, "var(--chrome-surface)");
  assert.equal((opening.padding.match(/safe-area-inset-top/g) ?? []).length, 1);
  assert.equal(hero.position, "relative");
  assert.equal(hero.isolation, "isolate");
  assert.equal(hero.background, "var(--opening-art)");
  assert.match(read(file), /--opening-art:[^;]*#173060/);
  assert.equal(phoneStyles(file, ".contours")["mask-image"], undefined);
  const page = read("components/PublicPlaidOpening.tsx");
  assert.match(
    page,
    /<\/header>\s*<section[^>]+className=\{s\.hero\}[^>]*>\s*<Contours\s*\/>/,
  );
});

test("phone sign-in shares its opaque outer canvas with the native theme without overriding status bar style or auth", () => {
  const file = "components/SessionAccess.css";
  const frame = '#auryn-app .mp-auth[data-plaid-page="access"]';
  assert.equal(phoneStyles(file, frame).background, "var(--chrome-surface)");
  assert.equal(
    phoneStyles(file, `${frame} > section`).background,
    "transparent",
  );
  assert.match(
    phoneStyles(file, frame)["padding-block-start"],
    /safe-area-inset-top/,
  );
  const layout = read("app/layout.tsx");
  assert.match(layout, /statusBarStyle:\s*"default"/);
  assert.match(layout, /viewportFit:\s*"cover"/);
  assert.match(
    read("components/Session.tsx"),
    /onClick=\{\(\) => social\("x"\)\}/,
  );
});
