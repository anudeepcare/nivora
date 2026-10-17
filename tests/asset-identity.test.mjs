import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {assetIdentity,assetLogoCandidates}=require('../lib/asset-identity.ts');
test('issuer identity protects against ticker collisions and insecure image URLs',()=>{
 assert.deepEqual(assetLogoCandidates('IREN','Iren SpA'),[]);
 assert.equal(assetIdentity('SOL','Emeren Group Ltd').crypto,null);
 assert.equal(assetIdentity('SOL/USD','Solana').crypto,'SOL');
 assert.deepEqual(assetLogoCandidates('UNKNOWN','Unknown','http://insecure.invalid/logo.png'),[]);
 assert.deepEqual(assetLogoCandidates('IREN','IREN Limited'),['/asset-logos/IREN.svg']);
});
test('reviewed logos are bundled and require no remote request on search',()=>{
 for(const row of JSON.parse(fs.readFileSync('verification/native-release/logo-sources.json','utf8'))){assert.ok(row.path,`Missing ${row.symbol}`);assert.ok(fs.statSync('public'+row.path).size>100);}
 assert.equal(assetIdentity('MSFT','Microsoft Corporation').microsoft,true);
 assert.deepEqual(assetLogoCandidates('AAPL','Apple Inc.'),['/asset-logos/AAPL.svg']);
});
