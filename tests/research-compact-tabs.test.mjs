import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";
const css = postcss.parse(readFileSync("app/core/reference-tabs.css", "utf8"));
function rules(fragment) {
  const result = [];
  css.walkRules((r) => {
    if (r.selector.includes(fragment)) result.push(r);
  });
  return result;
}
test("compact research rail is mobile scoped, single scroll line without changing primary tabs", () => {
  const matches = rules(".research-compact-tabs.research-compact-tabs");
  assert.ok(matches.length);
  for (const r of matches) assert.equal(r.parent.params, "(max-width: 600px)");
  const rail = matches.find((r) => !r.selector.includes(">"));
  const props = Object.fromEntries(
    rail.nodes.filter((n) => n.type === "decl").map((n) => [n.prop, n.value]),
  );
  assert.equal(props["flex-wrap"], "nowrap");
  assert.equal(props["overflow-x"], "auto");
  assert.equal(props["max-width"], "100%");
  assert.equal(props.background, "transparent");
});
test("compact selection uses one quiet item fill without underline and retains touch/focus/icon affordances", () => {
  const selected = rules(".research-compact-tabs.research-compact-tabs").find(
    (r) => r.selector.includes('[aria-pressed="true"]'),
  );
  assert.ok(selected);
  const props = Object.fromEntries(
    selected.nodes
      .filter((n) => n.type === "decl")
      .map((n) => [n.prop, n.value]),
  );
  assert.equal(props["box-shadow"], "none");
  assert.equal(props["border-bottom"], "0");
  assert.match(props.background, /view-tab-quiet/);
  const text = readFileSync("app/core/reference-tabs.css", "utf8");
  const mobile = text.slice(text.indexOf("/* Compact Research"));
  assert.match(mobile, /white-space:\s*nowrap/);
  assert.match(mobile, /min-height:\s*44px/);
  assert.match(mobile, /:focus-visible/);
  assert.match(mobile, /\[data-nav-icon\]/);
});

test("deep workspaces opt into the compact rail without changing activation", () => {
  const source = readFileSync("components/ResearchWorkspace.tsx", "utf8");
  assert.match(source, /className="auryn-view-tabs research-compact-tabs"/);
  assert.match(source, /navigateSelection\(event\)/);
  assert.match(source, /aria-pressed=\{selected === index\}/);
});

test("compact labels retain the full accessible workspace name", () => {
  const source = readFileSync("components/ResearchWorkspace.tsx", "utf8");
  assert.match(source, /shortTitle\?: string/);
  assert.match(source, /aria-label=\{view.title\}/);
  assert.match(source, /view.shortTitle \?\? view.title/);
});
