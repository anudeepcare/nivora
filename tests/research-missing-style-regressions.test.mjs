import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (n) => fs.readFileSync("components/" + n, "utf8");
function has(file, selector, prop, value) {
  let found = false;
  postcss.parse(read(file)).walkRules((r) => {
    if (r.selector === selector)
      r.walkDecls(prop, (d) => {
        if (d.value === value) found = true;
      });
  });
  assert.ok(found, `${file}: ${selector} ${prop}=${value}`);
}
test("compact and full analyst modes own styled surfaces and touch-sized question buttons", () => {
  const src = read("Analyst.tsx");
  assert.match(src, /import style from "\.\/Analyst.module.css"/);
  assert.match(src, /ask-auryn \$\{style.root\}/);
  assert.match(src, /<section className=\{style.root\}>/);
  has(
    "Analyst.module.css",
    ".root :global(.prompt-row button)",
    "min-height",
    "44px",
  );
  has("Analyst.module.css", ".root", "align-self", "start");
});
test("ownership and company driver content owns separated values, not concatenated inline spans", () => {
  assert.match(read("OwnershipPicture.tsx"), /OwnershipPicture.module.css/);
  has(
    "OwnershipPicture.module.css",
    ".root :global(.ownership-leading)",
    "display",
    "grid",
  );
  has(
    "ResearchScreens.module.css",
    ".surface :global(.business-driver-map article)",
    "grid-template-columns",
    "28px minmax(0, 1fr)",
  );
  has(
    "ResearchScreens.module.css",
    ".surface :global(.business-profile summary span)",
    "display",
    "block",
  );
});
test("cash bridge uses actual rendered tone names with explicit SVG fills", () => {
  const src = read("FinancialPicture.tsx");
  for (const tone of ["blue", "red", "green"])
    assert.ok(src.includes(`"${tone}"`));
  has(
    "ResearchMetrics.module.css",
    ".panel :global(.financial-cash-bridge rect)",
    "fill",
    "var(--blue)",
  );
  for (const [tone, token] of [
    ["red", "negative"],
    ["green", "positive"],
  ])
    has(
      "ResearchMetrics.module.css",
      `.panel :global(.financial-cash-bridge [data-tone="${tone}"] rect)`,
      "fill",
      `var(--${token})`,
    );
});
test("explorer statistics have a distinct metric grid and financial detail cards do not stretch", () => {
  has(
    "FinancialExplorer.module.css",
    ".explorer :global(.explorer-statistics)",
    "display",
    "grid",
  );
  has(
    "FinancialExplorer.module.css",
    ".explorer :global(.explorer-statistics) > div",
    "gap",
    "7px",
  );
  has(
    "ResearchMetrics.module.css",
    ".panel :global(.financial-detail-groups)",
    "align-items",
    "start",
  );
  has(
    "ResearchMetrics.module.css",
    ".panel :global(.financial-cash-bridge)",
    "width",
    "100%",
  );
});
