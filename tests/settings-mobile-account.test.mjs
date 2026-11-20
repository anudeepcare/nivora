import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import postcss from "postcss";
test("final mobile account layout reserves identity width before account actions", () => {
  const css = readFileSync("components/SettingsPage.module.css", "utf8").split(
    "/* Last account-row rule:",
  )[1];
  assert.match(css, /max-width: 600px/);
  assert.match(css, /display: grid/);
  assert.match(css, /grid-template-columns: 44px minmax\(0, 1fr\)/);
  assert.match(css, /grid-column: 1 \/ -1/);
  assert.match(css, /min-height: 44px/);
});
test("final mobile header is opaque in each theme with no backdrop dependency", () => {
  const css = postcss.parse(
    readFileSync("components/WorkspaceShell.module.css", "utf8"),
  );
  const theme = postcss.parse(readFileSync("app/core/plaid-theme.css", "utf8"));
  // Evaluate only header rules applicable at the given viewport. A later desktop
  // frosted rule must not fail a phone assertion, nor mask a phone regression.
  for (const dark of [false, true])
    for (const width of [320, 390, 767]) {
      const values = {};
      const priority = {};
      css.walkRules((rule) => {
        const selector = rule.selector;
        if (
          ![
            ".header",
            ".shell .header",
            ':global([data-theme="dark"]) .shell .header',
            '.shell[data-appearance="plaid"] .header',
          ].includes(selector)
        )
          return;
        if (selector.includes('data-theme="dark"') && !dark) return;
        let parent = rule.parent;
        while (parent) {
          if (parent.type === "atrule" && parent.name === "media") {
            const min = parent.params.match(/min-width:\s*(\d+)px/),
              max = parent.params.match(/max-width:\s*(\d+)px/);
            if ((min && width < +min[1]) || (max && width > +max[1])) return;
          }
          parent = parent.parent;
        }
        const rank = (selector.match(/\.[a-zA-Z]|\[/g) || []).length;
        rule.walkDecls((decl) => {
          if (rank >= (priority[decl.prop] ?? -1)) {
            values[decl.prop] = decl.value;
            priority[decl.prop] = rank;
          }
        });
      });
      let solid;
      theme.walkRules((rule) => {
        if (
          rule.selector === ":root" ||
          (dark && rule.selector === 'html[data-theme="dark"]')
        )
          rule.walkDecls("--plaid-surface", (d) => (solid = d.value));
      });
      assert.equal(
        values.background,
        "var(--plaid-surface)",
        `${width}px theme surface`,
      );
      assert.match(
        solid,
        /^#[a-f0-9]{6}$/i,
        "surface is opaque, not transparent glass",
      );
      assert.equal(solid, dark ? "#192132" : "#ffffff");
      assert.equal(
        values["backdrop-filter"],
        "none",
        `${width}px mobile backdrop`,
      );
      assert.equal(
        values["-webkit-backdrop-filter"],
        "none",
        `${width}px Safari backdrop`,
      );
    }
});
