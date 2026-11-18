import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=n=>readFileSync(`components/${n}.module.css`,'utf8');
test('Today available priority cells and paired evidence use equal fractional tracks',()=>{
 assert.match(css('TodaySequence'),/grid-template-columns: repeat\(auto-fit, minmax\(min\(100%, 240px\), 1fr\)\)/);
 assert.doesNotMatch(css('HomeWorkspace'),/grid-template-columns: minmax\(0, 1\.(?:2|25)fr\) minmax\(0, 1fr\)/);
 assert.match(css('HomeWorkspace'),/\.home\.home\.home \.priceDetails \{\s*align-self: stretch/);
});
test('company cards have neutral theme surfaces while gains and losses retain semantics',()=>{
 const s=css('HomeMarketCards');
 assert.match(s,/:global\(html\[data-theme="dark"\]\) \.card \{\s*background: var\(--card\)/);
 assert.doesNotMatch(s,/var\(--company-accent, #527cb8\) (?:12|16)%/);
 assert.match(s,/\.history\[data-direction="up"\] \{\s*color: var\(--green\)/);
 assert.match(s,/\.history\[data-direction="down"\] \{\s*color: var\(--red\)/);
});
