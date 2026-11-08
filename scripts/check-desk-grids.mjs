import fs from "node:fs/promises";
import assert from "node:assert/strict";
const { build } = await import(process.env.AURYN_ESBUILD_PATH || "esbuild");
const { chromium } = await import(
  process.env.AURYN_PLAYWRIGHT_PATH || "playwright"
);
const root = process.cwd(),
  out = "/tmp/auryn-desk-grids";
await fs.mkdir(out, { recursive: true });
const fixtures = {
  "next/link": `import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,
  "next/navigation": `export function usePathname(){return '/research/IREN'};export function useSearchParams(){return new URLSearchParams()};export function useRouter(){return{push(){}}}`,
  "./Session": `export function useProduct(){return {owner:'fixture',theme:'light',demo:{routePrefix:'/preview'},workspace:{positions:[],watchlist:[]},cache:new Map()}};export function useResource(key){return{data:key?.startsWith('news?')?{items:Array.from({length:6},(_,i)=>({title:'AppLovin reports quarterly results and updated operating outlook for investors '+i,url:'https://example.com/news/'+i,date:'2026-11-08'}))}:key?.startsWith('filings?')?{filings:Array.from({length:6},(_,i)=>({form:i%2?'8-K':'10-Q',title:'Results of Operations and Financial Condition · Submission of Matters to a Vote of Security Holders · Financial Statements and Exhibits',date:'2026-11-04',url:'https://example.com/filing/'+i})),issues:[]}:{snapshots:[],documents:[]},loading:false,error:'',refresh(){}}}`,
  "./WorkspacePreferences": `export function useWorkspacePreferences(){return {preferences:{visibleMetrics:['business','valuation','price','ownership']}}}`,
};
await build({
  stdin: {
    contents: `import React from 'react';import{createRoot}from'react-dom/client';import Value from './components/ValueStudio';import Financial from './components/FinancialPicture';import Targets from './components/TargetsEstimates';import Ratings from './components/AnalystRatings';import Updates from './components/CompanyUpdates';import Earnings from './components/EarningsReview';import r from './tests/fixtures/iren-observed-20261019.json';import desk from './components/ResearchDeskLayout.module.css';import visual from './components/ResearchTabVisuals.module.css';import './app/core/compatibility.css';import './app/core/foundation.css';import './app/appearance.css';import './app/core/surfaces.css';import './app/core/readability.css';import './app/core/mobile-glass.css';function App(){const[view,setView]=React.useState('Valuation');return <main className={\`product approved-product approved-research-page \${visual.root}\`} style={{padding:16}}><nav aria-label="Fixture views">{['Valuation','Financials','Analysts','News'].map(v=><button onClick={()=>setView(v)} key={v}>{v}</button>)}</nav><div data-research-section={view}><div className={desk.content} data-desk={view}>{view==='Valuation'?<Value research={r} onWorkbench={()=>{}}/>:view==='Financials'?<Financial research={r}/>:view==='News'?<Updates research={{...r,evidence:{...r.evidence,earnings:[{date:'2026-10-15',period:'2026-Q3',actual:4.30,estimate:3.94}]}}}><Earnings research={{...r,evidence:{...r.evidence,earnings:[{date:'2026-10-15',period:'2026-Q3',actual:4.30,estimate:3.94}]}}}/></Updates>:<><Targets research={r} ratings={<Ratings research={r} hideConsensus/>}/></>}</div></div></main>};createRoot(document.getElementById('root')).render(<App/>);`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  jsx: "automatic",
  external: ["/fonts/*", "/pace-diamond.svg"],
  outfile: out + "/app.js",
  plugins: [
    {
      name: "fixtures",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (a) =>
          fixtures[a.path] ? { path: a.path, namespace: "fixture" } : null,
        );
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          contents: fixtures[a.path],
          loader: "tsx",
          resolveDir: root,
        }));
      },
    },
  ],
});
const browser = await chromium.launch({
  executablePath: process.env.AURYN_CHROMIUM_PATH,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const report = [];
try {
  for (const width of [320, 390, 768, 1440, 1920])
    for (const theme of ["light", "dark"]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } }),
        errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("http://fixture.local/**", async (route) =>
        route.fulfill({
          contentType: "text/html",
          body: `<html data-theme="${theme}"><body id="auryn-app"><div id="root"></div></body></html>`,
        }),
      );
      await page.goto("http://fixture.local/");
      await page.addStyleTag({ path: out + "/app.css" });
      await page.addScriptTag({ path: out + "/app.js" });
      for (const view of ["Valuation", "Financials", "Analysts", "News"]) {
        await page.getByRole("button", { name: view, exact: true }).click();
        await page.locator(`[data-research-section="${view}"]`).waitFor();
        await page.evaluate(
          () =>
            new Promise((r) =>
              requestAnimationFrame(() => requestAnimationFrame(r)),
            ),
        );
        if (view === "Valuation") {
          assert.equal(await page.locator("[data-case]").count(), 3);
          assert.equal(
            await page
              .getByRole("region", { name: "Analyst price targets" })
              .count(),
            1,
          );
          const question = page.getByRole("region", {
            name: "What the price needs",
            exact: true,
          });
          const multiple = question.getByRole("spinbutton", {
            name: "Future P/E assumption",
            exact: true,
          });
          const returnInput = question.getByRole("spinbutton", {
            name: "Desired annual price return (%)",
            exact: true,
          });
          assert.equal(await multiple.inputValue(), "25");
          assert.equal(await returnInput.inputValue(), "8");
          const before = Number(
            (
              await question.locator('[aria-live="polite"]').innerText()
            ).replace(/[^0-9.]/g, ""),
          );
          await multiple.fill("50");
          const after = Number(
            (
              await question.locator('[aria-live="polite"]').innerText()
            ).replace(/[^0-9.]/g, ""),
          );
          assert.ok(
            Math.abs(before / 2 - after) <= 0.011,
            "Doubling the future P/E should halve the required EPS",
          );
          await multiple.fill("25");
          const inputStyle = await multiple.evaluate((el) => ({
            font: parseFloat(getComputedStyle(el).fontSize),
            width: el.getBoundingClientRect().width,
          }));
          assert.ok(
            inputStyle.font >= 22 && inputStyle.width >= 35,
            JSON.stringify(inputStyle),
          );
          const market = page.locator(".valuation-board");
          assert.ok((await market.locator("article").count()) >= 4);
          if (width === 1440) {
            const a = await page.locator("[data-case]").first().boundingBox(),
              b = await page
                .getByRole("region", { name: "Analyst price targets" })
                .boundingBox();
            assert.ok(b.x > a.x + a.width);
          }
          await page
            .getByText("What the price needs", { exact: true })
            .waitFor();
        }
        if (view === "Financials" && width === 1440) {
          const a = await page
              .getByRole("region", { name: "Financial chart explorer" })
              .boundingBox(),
            b = await page
              .getByRole("complementary", { name: "Current financial period" })
              .boundingBox();
          assert.ok(b.x > a.x + a.width);
          assert.ok(Math.abs(a.y - b.y) < 2);
        }
        if (view === "Analysts") {
          if (width === 1440) {
            const a = await page
                .getByRole("region", { name: "Analyst price targets" })
                .boundingBox(),
              b = await page.locator(".analyst-workspace").boundingBox();
            assert.ok(b.x > a.x + a.width);
            assert.ok(Math.abs(a.y - b.y) < 2);
          }
          await page
            .getByRole("tab", { name: "Annual estimates", exact: true })
            .click();
          await page
            .getByText("Annual EPS & revenue consensus", { exact: true })
            .waitFor();
          assert.equal(await page.locator(".analyst-workspace").count(), 0);
          await page
            .getByRole("tab", { name: "Historical price risk", exact: true })
            .click();
          await page
            .getByText("Historical price risk", { exact: true })
            .first()
            .waitFor();
        }
        if (view === "News") {
          assert.equal(
            await page.locator(".coverage-grid .source-row").count(),
            12,
          );
          assert.equal(
            await page.getByText("Quarterly report", { exact: true }).count(),
            3,
          );
          if (width >= 1440) {
            const panels = await page
              .locator(
                ".coverage-grid > section, .news-context-column > .earnings-review",
              )
              .evaluateAll((xs) =>
                xs.map((x) => ({
                  top: x.getBoundingClientRect().top,
                  heading: x.querySelector("h2").getBoundingClientRect().top,
                })),
              );
            assert.ok(
              Math.max(...panels.map((x) => x.top)) -
                Math.min(...panels.map((x) => x.top)) <
                2,
              JSON.stringify(panels),
            );
            assert.ok(
              Math.max(...panels.map((x) => x.heading)) -
                Math.min(...panels.map((x) => x.heading)) <
                2,
              JSON.stringify(panels),
            );
          }
          assert.ok(
            await page
              .locator(".source-row")
              .evaluateAll((xs) =>
                xs.every((x) => getComputedStyle(x).borderLeftWidth === "0px"),
              ),
          );
        }
        if (view === "Analysts") {
          await page
            .getByRole("tab", { name: "Conditional valuation", exact: true })
            .click();
          const bar = page.getByRole("region", {
            name: "Scenario P/E assumption",
          });
          await bar.waitFor();
          await bar.locator("input").fill("25");
          await page
            .getByRole("button", { name: "Reset P/E", exact: true })
            .click();
          assert.equal(await bar.locator("input").inputValue(), "");
          await bar.getByText("Assumptions & limits", { exact: true }).click();
        }
        const overflow = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
          offenders: [...document.querySelectorAll("main *")]
            .filter(
              (x) =>
                x.getBoundingClientRect().right > innerWidth + 1 &&
                !x.closest(".table-scroll"),
            )
            .map((x) => ({
              tag: x.tagName,
              cls: x.className,
              right: x.getBoundingClientRect().right,
            }))
            .slice(0, 8),
        }));
        assert.ok(
          overflow.scroll <= overflow.width + 1,
          JSON.stringify({ view, ...overflow }),
        );
        assert.deepEqual(errors, []);
        await page.screenshot({
          path: out + `/${view}-${width}-${theme}.png`,
          fullPage: true,
        });
        report.push({ view, width, theme, passed: true });
      }
      await page.close();
    }
} finally {
  await browser.close();
  await fs.mkdir("verification/reference-consistency-20261108", {
    recursive: true,
  });
  await fs.writeFile(
    "verification/reference-consistency-20261108/populated.json",
    JSON.stringify(report, null, 2),
  );
}
console.log(JSON.stringify(report, null, 2));
