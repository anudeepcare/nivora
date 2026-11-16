import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
const read = (p) => fs.readFileSync(p, "utf8");
function cssGraph(file, stack = []) {
  file = path.resolve(file);
  assert.ok(!stack.includes(file), "No circular CSS imports");
  const root = postcss.parse(read(file));
  const files = [file];
  root.walkAtRules("import", (node) => {
    const target = node.params.match(/^["']([^"']+)["']$/)?.[1];
    assert.ok(target, "Only explicit local imports");
    files.push(
      ...cssGraph(path.resolve(path.dirname(file), target), [...stack, file]),
    );
  });
  return files;
}
test("active foundation graph excludes the retired cascade and keeps parseable explicit dependencies", () => {
  const imports = [
    ...read("app/layout.tsx").matchAll(/import "(\.\/[^" ]+\.css)"/g),
  ].map((x) => "app/" + x[1].slice(2));
  assert.deepEqual(imports, [
    "app/core/foundation.css",
    "app/core/preferences.css",
    "app/core/primitives.css",
  ]);
  const graph = imports.flatMap((x) => cssGraph(x));
  assert.ok(graph.some((x) => x.endsWith("/tokens.css")));
  assert.ok(
    !graph.some((x) =>
      /legacy-panels|compatibility|appearance\.css|studio-glass/.test(x),
    ),
  );
  assert.doesNotMatch(read("components/Product.tsx"), /compatibility\.css/);
});
test("foundation retains readable font geometry, document scroll and asset integrity", () => {
  const root = postcss.parse(read("app/core/foundation.css"));
  const props = {};
  root.walkRules("html", (r) => r.walkDecls((d) => (props[d.prop] = d.value)));
  assert.equal(props["font-size"], "16px");
  assert.equal(props["overflow-y"], "auto");
  assert.match(
    read("app/core/foundation.css"),
    /font-family: var\(--font-ui\)/,
  );
  for (const file of cssGraph("app/core/foundation.css"))
    for (const m of read(file).matchAll(/url\(\s*['"]?([^)'"\s]+)/g))
      assert.match(m[1], /^(\/|data:|https?:|#)/);
});
