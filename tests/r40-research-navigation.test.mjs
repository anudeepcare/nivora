import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";

const read = (file) =>
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const root = postcss.parse(read("components/ReferenceCockpit.module.css"));
const shared = postcss.parse(read("app/core/reference-tabs.css"));

function rules(sheet, predicate) {
  const matches = [];
  sheet.walkRules((rule) => {
    if (predicate(rule)) matches.push(rule);
  });
  return matches;
}

function props(rule) {
  assert.ok(rule, "the visible navigation tier has dedicated styles");
  return Object.fromEntries(
    rule.nodes
      .filter(({ type }) => type === "decl")
      .map(({ prop, value }) => [prop, value]),
  );
}

test("Research separates major destinations from evidence rails without changing names or entry points", () => {
  const page = read("components/Research.tsx");
  assert.match(
    page,
    /className=\{cockpit\.lenses\}[\s\S]{0,180}data-research-nav="primary"/,
  );
  assert.match(
    page,
    /cockpit\.supporting[^\n]+\n\s*data-research-nav="secondary"/,
  );
  assert.match(page, /aria-label="Research sections"/);
  assert.match(page, /aria-label=\{`\$\{activeLens\.label\} evidence`\}/);
  const primary = props(
    rules(
      root,
      (r) =>
        r.parent.type === "root" &&
        r.selector === ".root[data-active-lens] > .lenses",
    )[0],
  );
  const secondary = props(
    rules(
      shared,
      (r) =>
        r.selector.includes('[data-research-nav="secondary"]') &&
        !r.selector.includes("button"),
    )[0],
  );
  assert.equal(primary.border, "0");
  assert.ok(Number.parseInt(primary["padding-block"].split(" ").at(-1)) >= 8);
  assert.ok(Number.parseInt(secondary["margin-block"].split(" ")[0]) >= 12);
  assert.equal(secondary.background, "transparent");
  assert.equal(secondary.border, "0");
});

test("narrow Research primary rail is a scrollable 44px-target row with visible focus and selection reveal", () => {
  const mobile = rules(
    root,
    (r) =>
      r.selector === ".root[data-active-lens] > .lenses" &&
      r.parent.type === "atrule",
  ).at(-1);
  const layout = props(mobile);
  assert.equal(layout["flex-wrap"], "nowrap");
  assert.equal(layout["overflow-x"], "auto");
  assert.equal(layout["min-width"], "0");
  assert.equal(layout["max-width"], "100%");
  assert.match(mobile.parent.params, /max-width:\s*767px/);
  const buttons = props(
    rules(
      root,
      (r) =>
        r.selector === ".root[data-active-lens] > .lenses button" &&
        r.parent === mobile.parent,
    )[0],
  );
  assert.equal(buttons["min-width"], "44px");
  assert.equal(buttons["white-space"], "nowrap");
  const page = read("components/Research.tsx");
  assert.match(page, /navigation\.scrollLeft \+=/);
  assert.match(
    page,
    /ref=\{researchNavigation\}[\s\S]{0,180}navigateSelection\(event\)/,
  );
  assert.ok(
    rules(root, (r) => r.selector.includes(".lenses button:focus-visible"))
      .length,
  );
});

test("nested Research selectors stay labelled and visually quieter than the parent rail", () => {
  const page = read("components/ResearchWorkspace.tsx");
  assert.match(page, /data-research-nav="detail"/);
  assert.match(page, /aria-label=\{`\$\{label\} views`\}/);
  const primary = props(
    rules(
      root,
      (r) =>
        r.parent.type === "root" &&
        r.selector === ".root[data-active-lens] > .lenses button",
    ).at(-1),
  );
  const lower = props(
    rules(
      shared,
      (r) =>
        r.parent.type === "root" &&
        r.selector.includes('[data-research-nav="detail"]') &&
        r.selector.includes("> button"),
    )[0],
  );
  assert.ok(
    Number.parseFloat(primary["font-size"]) >
      Number.parseFloat(lower["font-size"]),
  );
  const state = props(
    rules(
      shared,
      (r) =>
        r.parent.type === "root" &&
        r.selector.includes('[data-research-nav="detail"]') &&
        r.selector.includes('[aria-pressed="true"]'),
    )[0],
  );
  assert.equal(state["box-shadow"], "none");
  assert.match(state.background, /--plaid-card-purple/);
});
