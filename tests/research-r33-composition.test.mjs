import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (p) => fs.readFileSync(p, "utf8");
test("Atlas leads below orbit with all scenario values and evidence checks before supporting metrics", () => {
  const s = read("components/ReferenceAtlas.tsx");
  assert.ok(
    s.indexOf("className={s.lower}") <
      s.indexOf('aria-label="Company metric tape"'),
  );
  for (const phrase of [
    "rangeCards.map",
    "b.checks.map",
    "values.map",
    "PaceMonthHistory",
    "signal.target",
    "card.value",
    "item.value",
  ])
    assert.ok(s.includes(phrase));
  assert.match(s, /Business & timing metrics/);
});
test("shared research workspace exposes one current region without changing selected state or mounting", () => {
  const s = read("components/ResearchWorkspace.tsx");
  assert.match(s, /data-research-workspace/);
  assert.match(s, /data-research-view/);
  for (const phrase of [
    "navigateSelection(event)",
    "preserveState",
    "hidden={index !== selected}",
    "views[selected]?.content",
    "aria-controls",
  ])
    assert.ok(s.includes(phrase));
});
test("Research composition is open at outer stage, preserves smaller screen controls and readable tables", () => {
  const rules = postcss.parse(read("components/ResearchPlaid.module.css"));
  const val = (selector, prop) => {
    let result;
    rules.walkRules((r) => {
      if (r.selector === selector && r.parent.type !== "atrule")
        r.walkDecls(prop, (d) => (result = d.value));
    });
    return result;
  };
  assert.equal(
    val(".root.root [data-research-section]:not([hidden])", "border"),
    "0",
  );
  assert.equal(val(".root.root [data-research-workspace]", "min-width"), "0");
  assert.equal(
    val(".root.root [data-research-view]", "padding-block"),
    "16px 4px",
  );
  const atlas = postcss.parse(read("components/ReferenceAtlas.module.css"));
  let border;
  atlas.walkRules((r) => {
    if (r.selector === ".active.active")
      r.walkDecls("border-left", (d) => (border = d.value));
  });
  assert.equal(border, "0");
});
