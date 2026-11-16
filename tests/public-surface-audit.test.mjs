import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import postcss from "postcss";

const read = (path) => fs.readFileSync(path, "utf8");
const parse = (path) => postcss.parse(read(path));
function declarations(css, selectors, width = 1280) {
  const result = {};
  css.walkRules((rule) => {
    if (!rule.selectors.some((selector) => selectors.includes(selector)))
      return;
    for (let parent = rule.parent; parent; parent = parent.parent) {
      if (parent.type !== "atrule" || parent.name !== "media") continue;
      const max = parent.params.match(/max-width:\s*(\d+)px/);
      const min = parent.params.match(/min-width:\s*(\d+)px/);
      if ((max && width > +max[1]) || (min && width < +min[1])) return;
    }
    rule.walkDecls((decl) => {
      result[decl.prop] = decl.value;
    });
  });
  return result;
}
const rgb = (hex) =>
  hex
    .slice(1, 7)
    .match(/../g)
    .map((part) => parseInt(part, 16));
const mix = (a, b, fraction) =>
  rgb(a).map(
    (value, index) => value * fraction + rgb(b)[index] * (1 - fraction),
  );
function luminance(color) {
  return (Array.isArray(color) ? color : rgb(color))
    .map((value) => value / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    )
    .reduce(
      (sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
      0,
    );
}
const contrast = (a, b) =>
  (Math.max(luminance(a), luminance(b)) + 0.05) /
  (Math.min(luminance(a), luminance(b)) + 0.05);
function resolve(value, tokens) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) =>
    resolve(tokens[name], tokens),
  );
}

test("public guide text keeps AA contrast on both theme surfaces", () => {
  const css = parse("components/PublicLanding.module.css"),
    core = parse("app/core/tokens.css");
  assert.equal(declarations(css, [".page"]).color, "var(--ink)");
  assert.equal(declarations(css, [".previewBody p"]).color, "var(--muted)");
  for (const theme of ["light", "dark"]) {
    const tokens = {
      ...declarations(core, [":root", ':root[data-theme="light"]']),
      ...(theme === "dark"
        ? declarations(core, [':root[data-theme="dark"]'])
        : {}),
    };
    for (const surface of [tokens["--card"], tokens["--surface"]])
      for (const text of [tokens["--ink"], tokens["--muted"]])
        assert.ok(
          contrast(text, surface) >= 4.5,
          `${theme} ${text} on ${surface}`,
        );
  }
});

function pixels(expression, insets) {
  const replaced = expression.replace(
    /env\(safe-area-inset-(top|right|bottom|left)(?:,\s*0px)?\)/g,
    (_, side) => `${insets[side]}px`,
  );
  if (/^max\(/.test(replaced))
    return Math.max(
      ...postcss.list
        .comma(replaced.slice(4, -1))
        .map((part) => pixels(part, insets)),
    );
  assert.match(replaced, /^\d+(?:\.\d+)?(?:px)?$/);
  return parseFloat(replaced);
}
function padding(css, width, insets) {
  const style = declarations(css, [".page"], width);
  const values = postcss.list.space(style.padding);
  return [
    values[0],
    values[1] ?? values[0],
    values[2] ?? values[0],
    values[3] ?? values[1] ?? values[0],
  ].map((value) => pixels(value, insets));
}
test("public education and portfolio utility pages reserve all four device safe areas at every layout breakpoint", () => {
  const css = parse("components/PublicFrame.module.css");
  const insets = { top: 59, right: 44, bottom: 34, left: 44 };
  for (const width of [320, 390, 700, 768, 1024, 1440]) {
    const actual = padding(css, width, insets);
    ["top", "right", "bottom", "left"].forEach((side, index) => {
      assert.ok(
        actual[index] >= insets[side],
        `${width}px ${side} content must stay outside the unsafe area`,
      );
    });
  }
  assert.deepEqual(
    padding(css, 390, { top: 0, right: 0, bottom: 0, left: 0 }),
    [0, 16, 20, 16],
  );
  assert.deepEqual(
    padding(css, 1440, { top: 0, right: 0, bottom: 0, left: 0 }),
    [0, 28, 28, 28],
  );
});

test("offline retry uses the same readable brand control palette as the workspace in both system themes", () => {
  const document = read("public/offline.html");
  const css = postcss.parse(document.match(/<style>([\s\S]*?)<\/style>/)[1]);
  const button = declarations(css, ["button"]);
  const core = parse("app/core/tokens.css");
  const themed = (value, index) =>
    value.startsWith("light-dark(")
      ? postcss.list.comma(value.slice(11, -1))[index]
      : value;
  for (const [index, theme] of ["light", "dark"].entries()) {
    const tokens = declarations(core, [`:root[data-theme="${theme}"]`]);
    const background = themed(button.background, index);
    const color = themed(button.color, index);
    assert.equal(background, tokens["--nav-active"]);
    assert.ok(
      contrast(background, color) >= 4.5,
      `${theme} retry label must pass 4.5:1`,
    );
  }
});

test("public guide tabs stay readable and touch-sized on narrow phones", () => {
  const css = parse("components/PublicLanding.module.css");
  for (const width of [320, 390, 420, 768, 1440]) {
    const control = declarations(css, [".tabs button"], width);
    assert.ok(
      parseFloat(control["font-size"]) >= 12,
      `${width}px next label must not shrink into microtext`,
    );
    assert.ok(
      parseFloat(control["min-height"]) >= 44,
      `${width}px next button requires a 44px target`,
    );
  }
});

test("public text meets AA across conservatively composited gradient and glass endpoints", () => {
  const css=parse("components/PublicLanding.module.css"), core=parse("app/core/tokens.css");
  const rgba=(hex)=>{const h=hex.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)).concat(h.length===8?parseInt(h.slice(6,8),16)/255:1)};
  const blend=(front,back)=>front.slice(0,3).map((v,i)=>v*front[3]+back[i]*(1-front[3])).concat(1);
  const hex=(rgb)=>'#'+rgb.slice(0,3).map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  for(const theme of ['light','dark']){
    const tokens={...declarations(core,[':root',':root[data-theme="light"]']),...(theme==='dark'?declarations(core,[':root[data-theme="dark"]']):{})};
    const local={...declarations(css,['.page']),...(theme==='dark'?declarations(css,[':global([data-theme="dark"]) .page']):{})};
    const bg=rgba(tokens['--bg']);
    for(const a of [0,rgba(local['--public-tint-a'])[3]])for(const b of [0,rgba(local['--public-tint-b'])[3]]){
      const tintA=rgba(local['--public-tint-a']);tintA[3]=a;
      const tintB=rgba(local['--public-tint-b']);tintB[3]=b;
      const canvas=blend(tintA,blend(tintB,bg));
      const closing=blend(rgba(local['--public-close-tint']),canvas);
      const surfaces=[canvas,closing];
      for(const alpha of [.75,.94]){
        const card=rgba(tokens['--card']);card[3]=alpha;
        const glass=blend(card,canvas);surfaces.push(glass);
        const tab=rgba(tokens['--muted']);tab[3]=.06;surfaces.push(blend(tab,glass));
      }
      for(const surface of surfaces)for(const name of ['ink','muted'])assert.ok(contrast(tokens['--'+name],hex(surface))>=4.5,`${theme} ${name} on ${hex(surface)}`);
      assert.ok(contrast(local['--public-heading'],hex(canvas))>=3,`${theme} large accent heading`);
    }
  }
});
