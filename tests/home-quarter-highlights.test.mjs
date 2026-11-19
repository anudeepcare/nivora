import test from "node:test";
import assert from "node:assert/strict";
import { homeQuarterHighlights } from "../lib/home-quarter-highlights.ts";
const fact = (start, end, value, extra = {}) => ({
  id: end,
  metric: "revenue",
  value,
  unit: "USD",
  currency: "USD",
  start,
  end,
  filed: end === "2026-06-30" ? "2026-07-20" : "2026-10-20",
  accession: end,
  form: "10-Q",
  sourceUrl: "https://example.com/filing",
  basis: "GAAP",
  scope: "quarterly",
  ...extra,
});
const research = (facts) => ({
  company: { symbol: "TEST", name: "Test company" },
  quote: { currency: "USD" },
  retrievedAt: "2026-11-18",
  facts,
});
const pair = () => [
  fact("2026-04-01", "2026-06-30", 100),
  fact("2026-07-01", "2026-09-30", 120),
];
test("quarter highlights compare only consecutive reported periods with real denominator", () => {
  const [r] = homeQuarterHighlights([research(pair())], "2026-11-18");
  assert.ok(Math.abs(r.changePct - 20) < 1e-10);
  assert.equal(r.current, 120);
  assert.equal(r.previous, 100);
  assert.equal(r.to, "2026-09-30");
  assert.equal(r.from, "2026-06-30");
  const rows = pair();
  rows[1].value = 0;
  assert.equal(
    homeQuarterHighlights([research(rows)], "2026-11-18")[0].changePct,
    -100,
  );
});
test("missing, future, nonpositive denominator, nonadjacent or unmatched currency/basis never become quarter change", () => {
  for (const mutate of [
    (r) => r.pop(),
    (r) => (r[0].value = 0),
    (r) => (r[0].value = -10),
    (r) => (r[1].currency = "EUR"),
    (r) => (r[1].basis = "IFRS"),
    (r) => (r[1].filed = "2026-12-01"),
    (r) => {
      r[0].start = "2026-01-01";
      r[0].end = "2026-03-31";
    },
    (r) => (r[1].scope = "annual"),
  ]) {
    const rows = pair();
    mutate(rows);
    assert.deepEqual(homeQuarterHighlights([research(rows)], "2026-11-18"), []);
  }
});

test('conflicting same-filing revenues are withheld, later filings are not backdated',()=>{
 const rows=pair();rows.push({...rows[1],id:'conflict',value:130});
 assert.deepEqual(homeQuarterHighlights([research(rows)],'2026-11-18'),[]);
 assert.deepEqual(homeQuarterHighlights([research(pair())],'2026-10-01'),[]);
});
test('actual highlight rendering shows reported dates, amounts and sources without unfinished-quarter claim',async()=>{
 const fs=await import('node:fs'),ts=await import('typescript'),React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');
 const m={exports:{}};
 new Function('require','module','exports','React',ts.default.transpileModule(fs.readFileSync('components/HomeQuarterHighlights.tsx','utf8'),{compilerOptions:{jsx:ts.default.JsxEmit.React,module:ts.default.ModuleKind.CommonJS}}).outputText)(n=>n==='next/link'?{default:({children,...p})=>React.createElement('a',p,children)}:n.includes('home-quarter-highlights')?{homeQuarterHighlights}:{default:new Proxy({},{get:(_,k)=>String(k)})},m,m.exports,React);
 const html=renderToStaticMarkup(React.createElement(m.exports.default,{research:[research(pair())],asOf:'2026-11-18'}));
 assert.match(html,/\+20\.0%/);assert.match(html,/2026-06-30/);assert.match(html,/2026-09-30/);assert.match(html,/120 USD/);assert.match(html,/href="https:\/\/example.com\/filing"/);assert.match(html,/Not the unfinished calendar quarter/);
 assert.equal(renderToStaticMarkup(React.createElement(m.exports.default,{research:[],asOf:'2026-11-18'})),'');
});

test('revenue provenance and conflicts are not replaced by a later unrelated metric filing',()=>{
 const rows=pair();
 rows[1].sourceUrl='https://example.com/revenue';
 rows.push({...rows[1],metric:'netIncome',value:42,filed:'2026-11-01',sourceUrl:'https://example.com/income'});
 const [result]=homeQuarterHighlights([research(rows)],'2026-11-18');
 assert.equal(result.filed,'2026-10-20');
 assert.equal(result.source,'https://example.com/revenue');
 rows.push({...rows[1],value:130,id:'conflicting-revenue'});
 assert.deepEqual(homeQuarterHighlights([research(rows)],'2026-11-18'),[]);
});

test('quarter highlight text uses accessible foreground rather than chart blue',async()=>{
 const css=(await import('node:fs')).readFileSync('components/HomeQuarterHighlights.module.css','utf8');
 for(const selector of ['.grid header strong','.grid footer a']) {
 const body=css.split(selector+' {')[1].split('}')[0];
 assert.match(body,/color: var\(--ink\)/);
 }
 const luminance=h=>{const v=h.match(/\w\w/g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]};
 const tokens=(await import('node:fs')).readFileSync('app/core/tokens.css','utf8');
 const inks=[...tokens.matchAll(/--ink:\s*#([0-9a-f]{6})/g)].map(m=>m[1]);
 const cards=[...tokens.matchAll(/--card:\s*#([0-9a-f]{6})/g)].map(m=>m[1]);
 assert.ok(inks.length>=2 && cards.length>=2);
 for(const [i,fg] of inks.entries()) {
 const bg=cards[i];
 const a=luminance(fg),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);
 }
});
