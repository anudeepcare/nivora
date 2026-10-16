import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
function load(pathname){const calls=[],exports={};const source=ts.transpileModule(fs.readFileSync('lib/client-auth-navigation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(source,{exports,window:{location:{pathname,replace:path=>calls.push(path)}}});return {calls,...exports};}
test('account action and auth listener trigger only one sign-out navigation',()=>{const h=load('/analyze');h.navigateToLogin();h.navigateToLogin();assert.deepEqual(h.calls,['/login']);});
test('already signed out does not reload login',()=>{const h=load('/login');h.navigateToLogin();assert.deepEqual(h.calls,[]);});
