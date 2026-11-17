import test from "node:test";
import assert from "node:assert/strict";
import { companyRelationships } from "../lib/company-relationships.ts";
const fixture = () => ({
  ticker: "AAPL",
  root: "Apple",
  depth: 1,
  cap: 30,
  truncated: false,
  nodes: [
    { slug: "Apple", displayName: "Apple", type: "COMPANY" },
    { slug: "iPhone", displayName: "iPhone", type: "PRODUCT_OR_SERVICE" },
  ],
  edges: [
    {
      source: "iPhone",
      target: "Apple",
      type: "PRODUCT_OF",
      direction: "DIRECTED",
      properties: { secret: "drop" },
    },
  ],
});
test("bounded company graph preserves directed evidence and closes extra properties", () => {
  const r = companyRelationships(fixture());
  assert.equal(r.edges[0].source, "iPhone");
  assert.equal(r.edges[0].target, "Apple");
  assert.equal(r.edges[0].properties, undefined);
});
test("malformed, excessive and dangling relationships fail closed", () => {
  for (const change of [
    { root: "missing" },
    { depth: 2 },
    { cap: 200 },
    { nodes: [] },
    {
      edges: [
        { source: "x", target: "Apple", type: "OWNS", direction: "DIRECTED" },
      ],
    },
  ])
    assert.equal(companyRelationships({ ...fixture(), ...change }), null);
  const v = fixture();
  v.nodes.push(v.nodes[0]);
  assert.equal(companyRelationships(v), null);
});

test("adapter fixes bounded graph endpoint, checks ticker and closes DTO", async () => {
  const { createSentiSenseClient } = await import("../lib/sentisense-api.ts");
  const { intelligenceData } = await import("../lib/intelligence-dto.ts");
  const read = (body) =>
    createSentiSenseClient({
      key: "test",
      fetcher: async (url) => {
        assert.match(url, /\/stocks\/AAPL\/graph\?depth=1&cap=30$/);
        return new Response(JSON.stringify(body));
      },
    })("AAPL", "relationships");
  const r = await read(fixture());
  assert.equal(r.status, "available");
  assert.equal(
    intelligenceData("relationships", r.data).edges[0].properties,
    undefined,
  );
  assert.equal(
    (await read({ ...fixture(), ticker: "MSFT" })).status,
    "subject-mismatch",
  );
  assert.equal(
    (await read({ ...fixture(), root: "bad" })).status,
    "invalid-response",
  );
});
test("active business map is demo safe, explicit open and does not fan out", async () => {
  const fs = await import("node:fs");
  const component = fs.readFileSync(
    "components/CompanyRelationships.tsx",
    "utf8",
  );
  assert.match(component, /open && !preview/);
  assert.match(component, /dataset=relationships/);
  assert.doesNotMatch(
    component,
    /dangerouslySetInnerHTML|Promise\.all|fetch\(/,
  );
  assert.match(
    fs.readFileSync("components/BusinessMap.tsx", "utf8"),
    /preview=\{preview\}/,
  );
  assert.match(
    fs.readFileSync("components/Research.tsx", "utf8"),
    /<BusinessMap[\s\S]*?preview=\{!!demo\}/,
  );
});

test("graph display accepts canonical class shares but rejects foreign aliases", async () => {
  const { sameProviderSymbol } = await import("../lib/provider-symbol.ts");
  const fs = await import("node:fs");
  assert.match(
    fs.readFileSync("components/CompanyRelationships.tsx", "utf8"),
    /sameProviderSymbol\(resource\.data\.symbol, symbol\)/,
  );
  assert.equal(sameProviderSymbol("BRK.B", "BRK-B"), true);
  assert.equal(sameProviderSymbol("AAPL", "AAPL.L"), false);
  assert.equal(sameProviderSymbol("MSFT", "AAPL"), false);
});
