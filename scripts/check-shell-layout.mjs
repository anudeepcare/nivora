// Isolated actual Shell and full application CSS; account/search/router dependencies are fixtures.
const {build} = await import(process.env.AURYN_ESBUILD_PATH || 'esbuild');
const {chromium} = await import(process.env.AURYN_PLAYWRIGHT_PATH || 'playwright');
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.cwd();
const fixtures={
'next/link':`import React from 'react';export function useLinkStatus(){return {pending:false}};export default function Link({onNavigate,children,...p}){return <a {...p}>{children}</a>}`,
'next/navigation':`export function usePathname(){return '/overview'};export function useRouter(){return {push(){}}}`,
'./Session':`export function useProduct(){return {demo:{routePrefix:'/preview'},workspace:{email:'test@example.invalid'},theme:'light',setTheme(){}}}`,
'./Access':`export function useAccess(){return {access:{capabilities:{paperTrading:true}}}};export function AccessNotice(){return null}`,
'./ReleaseNotes':`export function ReleaseNotice(){return null}`,
'./Ui':`export function ProductFooter(){return <footer className="product-footer">AURYN</footer>}`,
'./Search':`export default function Search(){return <div className="search"><input aria-label="Search" /></div>}`,
'@/lib/client':`export function signOutAndRedirect(){}`
};
await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Shell from './components/Shell';import './app/core/compatibility.css';import './app/core/foundation.css';import './app/appearance.css';import './app/core/surfaces.css';import './app/core/readability.css';import './app/core/mobile-glass.css';createRoot(document.getElementById('root')).render(<Shell page="overview"><h1>Your investments</h1><div style={{height:1200}}>Workspace</div></Shell>);`,resolveDir:root,loader:'tsx'},bundle:true,external:['/fonts/*'],outfile:'/tmp/auryn-shell-fixture/app.js',jsx:'automatic',plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},a=>fixtures[a.path]?{path:a.path,namespace:'fixture'}:null);b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:fixtures[a.path],loader:'tsx',resolveDir:root}));}}]});
const browser=await chromium.launch({executablePath:process.env.AURYN_CHROMIUM_PATH || undefined,args:['--no-sandbox','--disable-gpu']});
const report=[];
try{for(const theme of ['light','dark']) for(const width of [320,390,768,1440]){const page=await browser.newPage({viewport:{width,height:844}});await page.setContent(`<html data-theme="${theme}"><body id="auryn-app"><div id="root"></div></body></html>`);await page.addStyleTag({path:'/tmp/auryn-shell-fixture/app.css'});await page.addScriptTag({path:'/tmp/auryn-shell-fixture/app.js'});await page.getByRole('button',{name:'Account and workspace tools'}).click();await page.locator('dialog[open]').evaluate(async e=>{await Promise.all(e.getAnimations().map(a=>a.finished.catch(()=>{})))});const result=await page.locator('dialog[open]').evaluate(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollHeight:e.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth,menuRowHeight:e.querySelector('.dialog-tools a').getBoundingClientRect().height}});report.push({theme,viewportWidth:width,...result}); if(width<768) assert.ok(result.menuRowHeight <= 76, `Phone menu rows too tall: ${result.menuRowHeight}`);assert.equal(result.overflow,false);await page.screenshot({path:`/tmp/auryn-menu-${theme}-${width}.png`});
await page.getByRole('button',{name:'Close tools'}).click();assert.equal(await page.locator('dialog[open]').count(),0);
await page.getByRole('button',{name:'Search companies and crypto',exact:true}).click();await page.getByLabel('Search',{exact:true}).waitFor();await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
if(width<768){await page.evaluate(()=>{document.documentElement.classList.add('keyboard-open')});assert.equal(await page.getByRole('navigation',{name:'Mobile navigation'}).isVisible(),false);}
await page.close();}}finally{await browser.close()};console.log(JSON.stringify(report,null,2));
