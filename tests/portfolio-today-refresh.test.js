import test from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';

test('a current authenticated portfolio quote completion redraws an active Today view',async()=>{
  const app=await readFile(new URL('../src/public/app.js',import.meta.url),'utf8');
  const handler=app.slice(app.indexOf("positions.querySelector('#refresh-quotes').onclick"),app.indexOf("positions.querySelectorAll('[data-position]')"));
  assert.match(handler,/version=\+\+portfolioQuoteRequestVersion/);
  assert.match(handler,/version!==portfolioQuoteRequestVersion\|\|!authState\.canNavigate\(\)/);
  assert.match(handler,/else if\(route==='today'\)render\('today'\)/);
  assert.ok(handler.indexOf('version!==portfolioQuoteRequestVersion')<handler.indexOf('portfolioQuotes=result.quotes'));
});
