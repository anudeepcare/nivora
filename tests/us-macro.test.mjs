import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUsGdp } from "../lib/us-macro.ts";
import { eodCallCost } from "../lib/market-policy.ts";
const row = (v, date = "2024-12-31") => ({
  CountryCode: "USA",
  CountryName: "United States",
  Indicator: "GDP growth (annual %)",
  Period: "Annual",
  Date: date,
  Value: v,
});
test("annual GDP preserves zero, negative and missing without publication-date inference", () => {
  const d = normalizeUsGdp(
    [row(0), row(-2, "2023-12-31"), row(null, "2022-12-31")],
    "2026-11-18",
  );
  assert.deepEqual(
    d.rows.map((x) => x.value),
    [null, -2, 0],
  );
  assert.equal(d.unit, "annual %");
  assert.equal("publishedAt" in d, false);
  assert.equal(eodCallCost("macro-indicator/USA"), 10);
});
test("GDP fails closed for wrong identity/unit, duplicate or future period, and malformed values", () => {
  for (const r of [
    { ...row(2), CountryCode: "GBR" },
    { ...row(2), Indicator: "GDP (current US$)" },
    { ...row(2), Period: "Quarterly" },
    row(2, "2027-12-31"),
    row("2"),
    row(Infinity),
  ])
    assert.throws(() => normalizeUsGdp([r], "2026-11-18"));
  assert.throws(() => normalizeUsGdp([row(1), row(2)], "2026-11-18"));
  assert.deepEqual(normalizeUsGdp([], "2026-11-18").rows, []);
});

test("actual fixed route gates before read and passes original annual observations to opt-in UI", async () => {
  const fs = await import("node:fs"),
    ts = await import("typescript"),
    React = await import("react"),
    { renderToStaticMarkup } = await import("react-dom/server");
  function load(path, name, bindings) {
    const ast = ts.default.createSourceFile(
      path,
      fs.readFileSync(path, "utf8"),
      99,
      true,
      path.endsWith("tsx") ? 4 : 3,
    );
    const src = ast.statements
      .filter((n) => !ts.default.isImportDeclaration(n))
      .map((n) =>
        n
          .getText(ast)
          .replace(/^export default /, "")
          .replace(/^export /, ""),
      )
      .join("\n");
    const js = ts.default.transpileModule(src, {
      compilerOptions: { jsx: ts.default.JsxEmit.React, target: 99 },
    }).outputText;
    return new Function(...Object.keys(bindings), js + ";return " + name)(
      ...Object.values(bindings),
    );
  }
  let sample = false,
    feature = true,
    reads = [];
  class HttpError extends Error {
    constructor(m, status) {
      super(m);
      this.status = status;
    }
  }
  const GET = load("app/api/us-macro/route.ts", "GET", {
    account: async () => ({ user: { id: "fixture" } }),
    requestAccess: async () => ({ sampleOnly: sample }),
    requireFeature: () => {
      if (!feature) throw new HttpError("Denied", 403);
    },
    limit: async () => {},
    HttpError,
    privateJson: (x) => Response.json(x),
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 500 }),
    normalizeUsGdp,
    eodRequest: async (...args) => {
      reads.push(args);
      return [row(0), row(-2, "2023-12-31")];
    },
  });
  sample = true;
  assert.equal(
    (await GET(new Request("https://app.test/api/us-macro"))).status,
    403,
  );
  sample = false;
  feature = false;
  assert.equal(
    (await GET(new Request("https://app.test/api/us-macro"))).status,
    403,
  );
  feature = true;
  assert.equal(
    (await GET(new Request("https://app.test/api/us-macro?country=GBR")))
      .status,
    400,
  );
  assert.equal(reads.length, 0);
  const data = await (
    await GET(new Request("https://app.test/api/us-macro"))
  ).json();
  assert.deepEqual(reads, [
    ["macro-indicator/USA", { indicator: "gdp_growth_annual" }, 86400000],
  ]);
  let open = false;
  const keys = [];
  const View = load("components/UsMacro.tsx", "UsMacro", {
    React,
    useState: () => [open, (x) => (open = x)],
    useResource: (key) => {
      keys.push(key);
      return { data, loading: false };
    },
    s: {},
  });
  let tree = View();
  assert.equal(keys.at(-1), null);
  const children = React.Children.toArray(tree.props.children);
  children[0].props.onClick();
  const html = renderToStaticMarkup(View());
  assert.equal(keys.at(-1), "us-macro");
  assert.match(html, />0%/);
  assert.match(html, />-2%/);
  assert.match(html, /not publication dates/);
  assert.doesNotMatch(html, /forecast growth/);
});
