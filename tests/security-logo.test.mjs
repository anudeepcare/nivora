import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {verifiedProfileLogo}=require('../lib/asset-identity.ts');
test('a provider logo is used only for a matching security and a secure URL',()=>{
 assert.equal(verifiedProfileLogo('NOW',{ticker:'NOW',logo:'https://static.example.test/now.png'}),'https://static.example.test/now.png');
 assert.equal(verifiedProfileLogo('NOW',{ticker:'WRONG',logo:'https://static.example.test/now.png'}),null);
 assert.equal(verifiedProfileLogo('NOW',{ticker:'NOW',logo:'http://static.example.test/now.png'}),null);
 assert.equal(verifiedProfileLogo('NOW',{ticker:'NOW',logo:'https://name:secret@static.example.test/now.png'}),null);
});
