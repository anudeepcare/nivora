import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs/promises';

test('Vercel preview entrypoint delegates to the same tested HTTP handler',async()=>{const api=await import('../api/index.js'),app=await import('../src/server/app.js');assert.equal(api.default,app.handler);assert.equal(typeof app.handler,'function')});
test('preview routing is explicit and never targets production',async()=>{const config=JSON.parse(await fs.readFile(new URL('../vercel.json',import.meta.url),'utf8'));assert.deepEqual(config.rewrites,[{source:'/(.*)',destination:'/api'}]);assert.equal(config.framework,null)});
