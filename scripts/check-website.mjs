import assert from 'node:assert/strict';
const base=(process.argv[2]||'http://terminal.local:4173').replace(/\/$/,'');
const paths=['/','/pricing','/sample','/about','/pace','/help','/contact','/methodology','/terms','/privacy','/risk','/reliability'];
for(const path of paths){const r=await fetch(base+path);assert.equal(r.status,200,path);const text=await r.text();assert.match(text,new RegExp('rel="canonical" href="https://www.auryninvest.com'+(path==='/'?'/?':path.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))+'"'),path);assert.match(text,/<h1[ >]/,path);assert.doesNotMatch(text,/<meta name="robots" content="noindex/,path);console.log('PASS public',path);}
for(const path of ['/login','/research/AAPL','/portfolio','/settings']){const r=await fetch(base+path);const text=await r.text();assert.match(text,/<meta name="robots" content="noindex/,path);console.log('PASS private noindex',path);}
const robots=await fetch(base+'/robots.txt');assert.match(robots.headers.get('content-type'),/text\/plain/);assert.match(await robots.text(),/Sitemap: https:\/\/www.auryninvest.com\/sitemap.xml/);console.log('PASS robots text');
const sitemap=await fetch(base+'/sitemap.xml');assert.match(sitemap.headers.get('content-type'),/xml/);const xml=await sitemap.text();assert.equal((xml.match(/<url>/g)||[]).length,paths.length);assert.doesNotMatch(xml,/\/preview|\/portfolio|\/research\//);console.log('PASS sitemap public routes');
const image=await fetch(base+'/opengraph-image');assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/image\/png/);assert.ok((await image.arrayBuffer()).byteLength>1000);console.log('PASS social image');
const missing=await fetch(base+'/not-a-real-page');assert.equal(missing.status,404);console.log('PASS unknown route 404');
