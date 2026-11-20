import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync("components/Plans.tsx", "utf8");
test("signed-in plan keeps provider status inside a single compact membership rail", () => {
  assert.match(
    source,
    /data-membership=\{!publicPage \? "account" : undefined\}/,
  );
  const rail = source.match(
    /<section className="plan-account-row"[\s\S]+?<\/section>/,
  )?.[0];
  assert.ok(rail);
  assert.match(rail, /Admin controls/);
  assert.match(rail, /Manage or cancel subscription/);
  assert.match(rail, /No Stripe billing account is linked/);
  assert.match(rail, /opening the portal does not cancel anything/);
});
test("membership overrides are scoped to signed-in, and the layout stacks on phones", () => {
  const css =
    readFileSync("components/Plans.module.css", "utf8").split(
      "/* Signed-in membership only:",
    )[1] ?? "";
  assert.match(css, /\.page\[data-membership="account"\]/);
  assert.match(css, /plans-heading[\s\S]+background: transparent/);
  assert.match(css, /max-width: 640px/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
});
