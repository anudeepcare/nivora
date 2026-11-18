import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
function load(file, name, bindings) {
  const ast = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const body = ast.statements
    .filter((n) => !ts.isImportDeclaration(n))
    .map((n) =>
      n
        .getText(ast)
        .replace(/^export default /, "")
        .replace(/^export /, ""),
    )
    .join("\n");
  const code = ts.transpileModule(body, {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return new Function(...Object.keys(bindings), code + ";return " + name)(
    ...Object.values(bindings),
  );
}
test("ETF consensus uses verified fund classification and never stock target endpoint", () => {
  const calls = [];
  const View = load(
    "components/SentiSenseConsensus.tsx",
    "SentiSenseConsensus",
    {
      React,
      EtfComposition: () => null,
      s: {
        workspace: "workspace",
        caption: "caption",
        stats: "stats",
        stat: "stat",
      },
      dateLabel: (v) => v,
      useResource: (key) => {
        calls.push(key);
        return {
          data: {
            status: "available",
            data: key?.includes("profile")
              ? { kind: "ETF" }
              : {
                  weightedConsensus: { upsidePercent: 12.4 },
                  coverage: {
                    holdingsCount: 100,
                    holdingsCovered: 50,
                    weightCovered: 65,
                    partial: true,
                  },
                  asOfDate: "2026-10-31",
                },
          },
        };
      },
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(View, { symbol: "QQQ", preview: false }),
  );
  assert.ok(calls.some((k) => k?.includes("dataset=etfAnalyst")));
  assert.ok(!calls.some((k) => k?.includes("dataset=consensus")));
  assert.match(html, /12.4%/);
  assert.match(html, /65%/);
  assert.match(html, /Not an analyst price target/);
  assert.match(html, /Partial holdings/);
});
test("unknown instrument type withholds consensus rather than guessing stock identity", () => {
  const calls = [];
  const View = load(
    "components/SentiSenseConsensus.tsx",
    "SentiSenseConsensus",
    {
      React,
      EtfComposition: () => null,
      s: {},
      dateLabel: (v) => v,
      useResource: (key) => {
        calls.push(key);
        return { data: { status: "unavailable", data: null } };
      },
    },
  );
  const html = renderToStaticMarkup(
    React.createElement(View, { symbol: "QQQ", preview: false }),
  );
  assert.equal(calls[1], null);
  assert.match(html, /Instrument type is not confirmed/);
});
test("market options route gates access and allowlists observations, excluding scores", async () => {
  let providerCalls = 0;
  let allowed = false;
  const route = load("app/api/options-overview/route.ts", "GET", {
    account: async () => ({ user: { id: "user" } }),
    limit: async () => {},
    requestAccess: async () => ({
      enabled: true,
      owner: false,
      features: { options: allowed },
    }),
    reserveAccess: async () => {},
    HttpError: class extends Error {
      constructor(m, s) {
        super(m);
        this.status = s;
      }
    },
    failure: (e) =>
      Response.json({ error: e.message }, { status: e.status ?? 500 }),
    privateJson: (v) => Response.json(v),
    sentisenseOptionsOverview: async () => {
      providerCalls++;
      return {
        status: "available",
        data: {
          asOf: "2026-11-16",
          rows: [
            {
              ticker: "AAPL",
              atmIv: 0.25,
              pcVol: 0,
              interestScore: 90,
              sentiment: "bullish",
            },
          ],
          etfRows: [{ ticker: "QQQ", atmIv: 0.2, pcVol: 1 }],
          marketScore: 99,
        },
      };
    },
  });
  let response = await route(
    new Request("https://app.test/api/options-overview"),
  );
  assert.equal(response.status, 403);
  assert.equal(providerCalls, 0);
  allowed = true;
  response = await route(new Request("https://app.test/api/options-overview"));
  const data = await response.json();
  assert.equal(data.data.rows[0].pcVol, 0);
  assert.equal(data.data.etfRows[0].ticker, "QQQ");
  assert.doesNotMatch(
    JSON.stringify(data),
    /interestScore|sentiment|marketScore/,
  );
});
test("user-facing market errors are neutral while source provenance is retained", () => {
  const source = fs.readFileSync("lib/eodhd.ts", "utf8");
  assert.doesNotMatch(
    source,
    /"(?:Add EODHD_API_KEY|EODHD (?:did not|returned|could not|request))/,
  );
  assert.match(source, /source: "EODHD"/);
});
test("market overview pages stock and ETF observations with exact units, search and links", () => {
  let states = ["stocks", "", 0], index = 0;
  const records = [{ticker:"AAPL",atmIv:0.25,pcVol:0}, ...Array.from({length:50},(_,i)=>({ticker:`S${i}`,atmIv:null,pcVol:null}))];
  const View = load("components/OptionsMarketOverview.tsx", "OptionsMarketOverview", {
    React, Link: ({children,...p})=>React.createElement("a",p,children), picker:{}, s:{},
    useState: (initial)=>[states[index++] ?? initial,()=>{}],
    useResource:()=>({data:{status:"available",data:{asOf:"2026-11-16",rows:records,etfRows:[{ticker:"QQQ",atmIv:0.2,pcVol:1}]}}}),
  });
  const render=(next)=>{states=next;index=0;return renderToStaticMarkup(React.createElement(View));};
  const first=render(["stocks","",0]);
  assert.match(first,/25.00%/); assert.match(first,/0.00×/); assert.doesNotMatch(first,/QQQ/);
  assert.equal((first.match(/<tr>/g)||[]).length,26); assert.match(first,/Page 1 of 3/);
  assert.match(first,/Not supplied/); assert.match(first,/2026-11-16/);
  const last=render(["stocks","",2]); assert.match(last,/S49/); assert.doesNotMatch(last,/href="\/research\/AAPL/); assert.match(last,/Page 3 of 3/);
  const fund=render(["funds","",0]); assert.match(fund,/QQQ/); assert.doesNotMatch(fund,/href="\/research\/AAPL/);
  const empty=render(["stocks","missing",0]); assert.match(empty,/No instruments match/); assert.match(empty,/Search covered instruments/);
  const matched=render(["stocks","  aaPl  ",0]); assert.match(matched,/href="\/research\/AAPL\?tab=Options"/); assert.match(matched,/25.00%/);
  assert.match(matched,/aria-label="Market options observations" tabindex="0"/);
  assert.equal((matched.match(/<table/g)||[]).length,1);
});
test("ETF holdings only requests its endpoint after composition is opened", () => {
  let state = [false, ""],
    index = 0;
  const calls = [];
  const View = load("components/EtfComposition.tsx", "EtfComposition", {
    React,
    useState: (initial) => {
      const at = index++;
      return [state[at] ?? initial, (v) => (state[at] = v)];
    },
    useResource: (key) => {
      calls.push(key);
      return { data: { status: "available", data: { holdings: [] } } };
    },
    etfComposition: () => ({
      rows: [],
      date: null,
      partial: false,
      totalKnown: null,
    }),
    IntelligenceTable: () => null,
  });
  let tree = View({ symbol: "QQQ" });
  assert.equal(calls.at(-1), null);
  tree.props.onToggle({ currentTarget: { open: true } });
  index = 0;
  tree = View({ symbol: "QQQ" });
  assert.equal(calls.at(-1), "intelligence/QQQ?dataset=etfHoldings");
  tree.props.onToggle({ currentTarget: { open: false } });
  index = 0;
  View({ symbol: "QQQ" });
  assert.equal(calls.at(-1), null);
});
test("large fund holdings render in bounded batches without additional requests", () => {
  let state = [true, "", 50],
    index = 0;
  const rendered = [];
  const View = load("components/EtfComposition.tsx", "EtfComposition", {
    React,
    useState: (initial) => {
      const at = index++;
      return [state[at] ?? initial, (v) => (state[at] = v)];
    },
    useResource: () => ({ data: { status: "available", data: {} } }),
    etfComposition: () => ({
      rows: Array.from({ length: 180 }, (_, i) => ({ label: `Holding ${i}` })),
      date: "2026-11-01",
      partial: false,
      totalKnown: 180,
    }),
    IntelligenceTable: ({ rows }) => {
      rendered.push(rows.length);
      return null;
    },
  });
  let tree = View({ symbol: "QQQ" });
  renderToStaticMarkup(tree);
  assert.equal(rendered.at(-1), 50);
  const nodes = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    nodes.push(n);
    React.Children.forEach(n.props?.children, walk);
  };
  walk(tree);
  nodes.find((n) => n.type === "button").props.onClick();
  index = 0;
  renderToStaticMarkup(View({ symbol: "QQQ" }));
  assert.equal(rendered.at(-1), 100);
});

test("Scenarios analyst source fallback appears only when the primary stock dataset is unavailable", () => {
  let available = false;
  const View = load(
    "components/SentiSenseConsensus.tsx",
    "SentiSenseConsensus",
    {
      React,
      EtfComposition: () => null,
      Help: () => null,
      s: {},
      layout: {},
      dateLabel: (v) => v ?? "",
      consensusTarget: (v, c) => `${c ?? "unknown"} ${v}`,
      useResource: (key) => ({
        loading: false,
        data: key?.includes("profile")
          ? { status: "available", data: { kind: "STOCK" } }
          : available
            ? {
                status: "available",
                asOf: "2026-11-17",
                retrievedAt: "2026-11-17",
                data: {
                  targetLow: 80,
                  targetMean: 100,
                  targetHigh: 120,
                  numberOfAnalysts: 12,
                  currency: "USD",
                },
              }
            : { status: "unavailable", data: null },
      }),
    },
  );
  const render = () =>
    renderToStaticMarkup(
      React.createElement(View, {
        symbol: "TEST",
        preview: false,
        fallback: React.createElement("p", null, "Alternate evidence"),
      }),
    );
  assert.match(render(), /Alternate evidence/);
  assert.match(render(), /not merged/);
  available = true;
  const html = render();
  assert.doesNotMatch(html, /Alternate evidence/);
  for (const value of ["USD 80", "USD 100", "USD 120", "12", "2026-11-17"])
    assert.ok(html.includes(value));
});

test('failed analyst evidence has explicit scoped retry without bypassing classification',()=>{
 for(const kind of [null,'STOCK','ETF']){
  const refreshed=[]; const requested=[];
  const View=load('components/SentiSenseConsensus.tsx','SentiSenseConsensus',{
   React,EtfComposition:()=>null,s:{},layout:{},dateLabel:v=>v,
   useResource:key=>{
    requested.push(key);
    return {loading:false,error:key?.includes('profile')&&kind?null:'Temporary outage',
     data:key?.includes('profile')&&kind?{status:'available',data:{kind}}:undefined,
     refresh:()=>refreshed.push(key)};
   },
  });
  const tree=View({symbol:'TEST',preview:false,fallback:React.createElement('p',null,'Alternate dated evidence')});
  const buttons=[];
  function walk(n){if(!n||typeof n!=='object')return;if(n.type==='button')buttons.push(n);React.Children.forEach(n.props?.children,walk);}
  walk(tree);
  const retry=buttons.find(n=>String(n.props.children).startsWith('Retry'));
  assert.ok(retry,'failed '+(kind??'classification')+' exposes retry');
  assert.equal(refreshed.length,0,'no automatic retry loop');
  retry.props.onClick();
  assert.equal(refreshed.length,1);
  assert.match(refreshed[0],new RegExp('dataset='+(kind===null?'profile':kind==='ETF'?'etfAnalyst':'consensus')));
  if(kind===null)assert.equal(requested[1],null,'unknown identity cannot request targets');
 }
});
test("paged market surface has one horizontal scroller without nested vertical traps",()=>{
 const css=fs.readFileSync("components/OptionsMarketOverview.module.css","utf8");
 assert.match(css,/overflow-x: auto/); assert.doesNotMatch(css,/max-height:|overflow-y:|overscroll-behavior: contain/);
 const source=fs.readFileSync("components/OptionsMarketOverview.tsx","utf8");
 assert.match(source,/const pageSize = 25/); assert.doesNotMatch(source,/IntelligenceTable|picker.scroll/);
 assert.match(source,/setQuery\(event.target.value\);\s+setPage\(0\)/);
 assert.match(source,/setBoard\(id\);\s+setPage\(0\)/);
});
test("standalone market page hides embedded duplicate heading and self-link",()=>{
 const source=fs.readFileSync("components/OptionsMarketOverview.tsx","utf8");
 assert.match(source,/!standalone &&/);
 const page=fs.readFileSync("components/OptionsMarketPage.tsx","utf8");
 assert.match(page,/<OptionsMarketOverview standalone/);
 assert.match(page,/className=\{layout.viewSwitch\}/);
 const css=fs.readFileSync("components/OptionsMarketOverview.module.css","utf8");
 assert.match(css,/\.universe button\[aria-pressed="true"\]/);
 assert.match(css,/\.pagination button:disabled/);
});
