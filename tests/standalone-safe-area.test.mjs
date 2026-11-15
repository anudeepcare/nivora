import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";
const read = (p) => fs.readFileSync(p, "utf8");
const safe = (value) =>
  ["top", "right", "bottom", "left"].every((edge) =>
    value.includes(`safe-area-inset-${edge}`),
  );
for (const [file, selector] of [
  ["Contact", ".page.page.page"],
  ["ReleaseNotes", ".page"],
  ["LegalDocument", ".document.document.document"],
]) {
  test(`${file} standalone padding protects all screen edges at every breakpoint`, () => {
    const root = postcss.parse(read(`components/${file}.module.css`));
    let count = 0;
    root.walkRules(selector, (rule) =>
      rule.walkDecls("padding", (d) => {
        count++;
        assert.ok(safe(d.value), `${file}: ${d.value}`);
      }),
    );
    assert.ok(count > 0);
  });
}
function effectivePadding(file, selector, width) {
  const result = {};
  postcss.parse(read(file)).walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return;
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type !== "atrule" || parent.name !== "media") continue;
      const max = parent.params.match(/max-width:\s*(\d+)px/),
        min = parent.params.match(/min-width:\s*(\d+)px/);
      if ((max && width > +max[1]) || (min && width < +min[1])) return;
    }
    rule.walkDecls((d) => {
      if (d.prop === "padding") {
        const p = postcss.list.space(d.value);
        [result.top, result.right, result.bottom, result.left] = [
          p[0],
          p[1] ?? p[0],
          p[2] ?? p[0],
          p[3] ?? p[1] ?? p[0],
        ];
      } else if (d.prop === "padding-inline") {
        result.left = d.value;
        result.right = d.value;
      } else if (d.prop.startsWith("padding-"))
        result[d.prop.slice(8)] = d.value;
    });
  });
  return result;
}
test("studio public Plans preserves each device safe area at every breakpoint", () => {
  for (const width of [320, 390, 700, 768, 1440]) {
    const padding = effectivePadding(
      "components/Plans.module.css",
      ".page:global(.plans-public)",
      width,
    );
    for (const side of ["top", "right", "bottom", "left"])
      assert.ok(
        padding[side]?.includes(`safe-area-inset-${side}`),
        `${width}px Plans ${side}`,
      );
  }
});
test("studio auth main and story protect their four screen edges", () => {
  for (const selector of [".main", ".story"])
    for (const width of [320, 390, 768, 1024, 1440]) {
      const padding = effectivePadding(
        "components/Session.module.css",
        selector,
        width,
      );
      for (const side of ["top", "right", "bottom", "left"])
        assert.ok(
          padding[side]?.includes(`safe-area-inset-${side}`),
          `${width}px auth ${selector} ${side}`,
        );
    }
});
test("password recovery shares login styling and retains scoped safe-area padding", () => {
  const src = read("components/PasswordRecovery.tsx");
  assert.match(src, /Session.module.css/);
  for (const owner of ["auth", "story", "main"]) assert.ok(src.includes(`experience.${owner}`));
  const css = postcss.parse(read("app/core/readability.css"));
  let count = 0;
  css.walkRules((rule) => {
    if (!rule.selector.includes('[data-auth-mode="recovery"]')) return;
    rule.walkDecls((d) => {
      assert.equal(d.prop, "padding");
      assert.ok(safe(d.value));
      count++;
    });
  });
  assert.ok(count >= 3, "recovery story, main and mobile main reserve insets");
  assert.match(src, /fetch\("\/api\/auth\/recovery"/);
});
test("release heading uses readable theme-aware foreground", () => {
  assert.match(
    read("components/ReleaseNotes.module.css"),
    /\.page > h1[^}]+color: var\(--ink\)/,
  );
});
