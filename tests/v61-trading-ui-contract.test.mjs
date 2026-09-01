import fs from 'node:fs';import test from 'node:test';import assert from 'node:assert/strict';
const page=fs.readFileSync(new URL('../app/trading-lab/page.tsx',import.meta.url),'utf8');const shell=fs.readFileSync(new URL('../components/AppShell.tsx',import.meta.url),'utf8');
test('Trading Lab page clearly says paper trading and earned results',()=>{assert.match(page,/PAPER/i);assert.match(page,/Profit factor/i);assert.match(page,/Win rate/i);assert.match(page,/No live-money auto execution/i)});
test('Trading Lab is reachable from primary navigation',()=>{assert.match(shell,/\/trading-lab/);assert.match(shell,/Trading Lab/)});
