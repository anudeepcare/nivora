import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("all workspace pages get one readable footer with support, disclosures and no repeated link markup", () => {
  const shell = read("components/Shell.tsx");
  const footer = read("components/Ui.tsx").split(
    "export function ProductFooter",
  )[1];
  assert.match(shell, /<ProductFooter\s*\/>/);
  assert.match(footer, /data-auryn-footer/);
  assert.match(footer, /<summary>Guides &amp; legal<\/summary>/);
  assert.match(footer, /href|ContextLink/);
  assert.match(footer, /Research disclosure/);
  assert.doesNotMatch(footer, /className="footer-desktop"/);
  assert.equal((footer.match(/\{links\}/g) || []).length, 1);
  for (const dest of [
    "changelog",
    "methodology",
    "terms",
    "privacy",
    "risk",
    "reliability",
  ])
    assert.match(footer, new RegExp(dest + ":"));
});
test("shared footer wraps at narrow widths and retains readable keyboard and touch controls", () => {
  const css = read("app/core/auryn-controls.css");
  assert.match(css, /\[data-auryn-footer\]/);
  assert.match(css, /flex-wrap: wrap/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /max-width: 767px/);
});
test("copyright, footer links and disclosure trigger share one type scale", () => {
  const css = read("app/core/auryn-controls.css");
  assert.match(css, /--auryn-footer-text:\s*0\.875rem/);
  assert.match(
    css,
    /:is\(\.auryn-footer-copy, a, summary, \.help-trigger\)\s*\{[^}]*font-size:\s*var\(--auryn-footer-text\)/,
  );
});
test("secondary evidence actions use the shared link treatment without a boxed surface", () => {
  const css = read("app/core/auryn-controls.css");
  assert.match(
    css,
    /\.auryn-inline-link\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/,
  );
  for (const file of [
    "DecisionOverview",
    "DecisionInsights",
    "ResearchBalance",
    "ContributionCompare",
    "ResearchNotes",
  ])
    assert.match(read(`components/${file}.tsx`), /auryn-inline-link/);
});
