import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL(`../components/${name}`, import.meta.url), 'utf8');
test('Settings owns an explicit mobile-first layout without unplaced grid children', () => {
 const css=read('SettingsPage.module.css');
 assert.match(css,/grid-template-areas:\s*"toolbar"\s*"eyebrow"\s*"heading"\s*"feedback"\s*"account"\s*"sections"\s*"preferences"\s*"support"/);
 assert.match(css,/grid-area: sections/);
 assert.match(css,/grid-area: eyebrow/);
 assert.match(css,/scroll-margin-top/);
});
test('Help has a scoped reading layout and navigable topics', () => {
 const source=read('SupportingViews.tsx');
 assert.match(source,/helpStyles\.page/);
 assert.match(source,/aria-label="Methodology topics"/);
 assert.match(source,/id=\{`methodology-\$\{index\}`\}/);
});
test('Owner guide uses theme surfaces instead of hard-coded green cover', () => {
 const css=read('OwnerHandbook.module.css');
 assert.doesNotMatch(css,/#202c27|#29382d|#d6f35a/);
 assert.match(css,/var\(--ink\)/);
});
test('Owner member grid confines long lists and keeps table headers visible', () => {
 const css=read('OwnerAccess.module.css');
 assert.match(css,/max-height: 560px/);
 assert.match(css,/position: sticky/);
 assert.match(css,/overscroll-behavior: contain/);
});
test('support tickets use readable grouped surfaces and phone-sized actions', () => {
 const css=read('SupportInbox.module.css');
 assert.match(css,/border-radius: 20px/);
 assert.match(css,/\.inbox button[^}]+min-height: 44px/s);
 assert.match(css,/\.ticket > summary:focus-visible/);
});
test('Methodology distinguishes eligible Pace models and confirmed ledger benchmark balances', () => {
 const help = read('SupportingViews.tsx').split('export function HelpPage')[1];
 assert.match(help,/daily trend, volatility and momentum/);
 assert.match(help,/release date and sufficient data/i);
 assert.doesNotMatch(help,/monthly-v5 price policy/);
 assert.match(help,/confirming a complete USD ledger/i);
 assert.match(help,/same dated deposits and withdrawals/i);
 assert.match(help,/hypothetical balances, not percentage returns/i);
});
