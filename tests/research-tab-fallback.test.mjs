import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('retained research panels follow resolved fallback and cached tabs',()=>{
const source=readFileSync('components/Research.tsx','utf8');
const expression=source.match(/const \[retainedCharts, setRetainedCharts\] = useState<string\[\]>\(\(\) =>([\s\S]*?)\n  \);/)[1].trim().replace(/,$/,'');
const evaluate=new Function('requestedTab','tab',`return (${expression});`);
assert.deepEqual(evaluate('bogus','Snapshot'),['Snapshot']);
assert.deepEqual(evaluate(null,'Technicals'),['Technicals']);
assert.deepEqual(evaluate(null,'Options'),[]);
});
