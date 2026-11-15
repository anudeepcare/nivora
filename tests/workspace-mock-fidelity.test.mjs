import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(file)=>readFileSync(`components/${file}`,'utf8');
test('watchlist puts actual companies before supporting review and keeps compact evidence',()=>{
 const source=read('WatchlistPage.tsx');
 assert.ok(source.indexOf('title="Your watchlist"') < source.indexOf('<DecisionAttention'));
 assert.match(source,/<DecisionAttention\s+compact/);
 assert.doesNotMatch(source,/Companies in your watchlist<\/p>/);
});
test('workspace surfaces do not restore the rejected dark watchlist billboard',()=>{
 const css=read('WorkspaceVisuals.module.css');
 assert.doesNotMatch(css,/background: var\(--ink\)/);
 assert.match(css,/background: var\(--workspace-glass\)/);
 assert.match(css,/prefers-reduced-transparency/);
});
test('public hero is a paired product composition rather than a tall editorial stack',()=>{
 assert.match(read('PublicLanding.module.css'),/grid-template-columns: minmax\(0, 0\.8fr\) minmax\(0, 1\.2fr\)/);
 assert.doesNotMatch(read('PublicLanding.tsx'),/Research\.\s*<br \/>\s*<span>Decide\.<\/span>/);
});

test('support priority and status labels have independent width rather than shrinking beside full-width selects',()=>{
 const source=read('SupportInbox.tsx');
 assert.match(source, /<span>Priority<\/span>/);
 assert.match(source, /<span>Status<\/span>/);
 assert.match(read('SupportInbox.module.css'), /grid-template-columns: 80px minmax\(0, 1fr\)/);
});

test('settings uses compact separator-free rows and transparent nested segments',()=>{
 const css=read('SettingsPage.module.css');
 assert.doesNotMatch(css,/border-bottom:/);
 assert.match(css,/min-height: 52px/);
 assert.match(css,/background: var\(--workspace-glass\)/);
 const segment=css.match(/\.page :global\(\.segments\) \{([^}]+)\}/)?.[1];
 assert.match(segment ?? '',/background: transparent/);
 assert.match(css,/min-height: 44px/);
});

test('password recovery shares login composition instead of legacy-only classes',()=>{
 const source=read('PasswordRecovery.tsx');
 assert.match(source,/import experience from "\.\/Session.module.css"/);
 for (const name of ['auth','main','story','storyContent']) assert.ok(source.includes(`experience.${name}`));
});
test('support and release decoration no longer uses the retired green interaction palette',()=>{
 assert.doesNotMatch(read('Contact.module.css'),/#319688|accent-color: var\(--green\)/);
 assert.doesNotMatch(read('ReleaseNotes.module.css'),/var\(--green\)|#294d38/);
});
test('discovery results can be scrolled with a keyboard',()=>{
 assert.match(read('Discover.tsx'),/className="table-scroll"\s+role="region"\s+aria-label="Discovered companies"\s+tabIndex=\{0\}/);
});
