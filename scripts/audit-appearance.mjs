import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const css=readFileSync(new URL('../app/auryn-next.css',import.meta.url),'utf8');
for(const token of ['--auryn-page-bg','--auryn-chrome','--auryn-card-bg','--auryn-hero-bg-a','--auryn-accent','data-density','data-text-size','data-motion'])assert.ok(css.includes(token),`missing ${token}`);
for(const anti of ['background:#101b2d!important','background:#edf2f8!important','background:#fff!important'])assert.ok(!css.includes(anti),`theme-breaking override ${anti}`);
console.log('Appearance stylesheet static contract: PASS');
