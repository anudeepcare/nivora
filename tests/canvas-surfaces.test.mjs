import { readCompatCss } from './read-compat-css.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
test('public contact asks for a reply address instead of reading account email',()=>{
 const s=fs.readFileSync('components/Contact.tsx','utf8');assert.doesNotMatch(s,/getSession|authClient/);assert.match(s,/Your reply email/);
});
test('help explains price Pace separately and avoids release-specific reinstall instructions',()=>{
 const s=fs.readFileSync('lib/legal-content.ts','utf8');assert.match(s,/Completed month/);assert.doesNotMatch(s,/root status surface|October 18 status-bar|Pace uses confirmed monthly price conditions and pauses additions when severe/);
});
test('common design is loaded before the independently owned PWA shell',()=>{
 const s=fs.readFileSync('app/core/legacy-panels.css','utf8');const styles=readCompatCss('app/product.css');assert.ok(s.indexOf('BEGIN legacy-source: app/product.css')>0);assert.ok(s.indexOf('BEGIN legacy-source: app/product.css')<s.indexOf('BEGIN legacy-source: app/pwa-shell.css'));assert.ok(styles.indexOf('BEGIN legacy-source: app/canvas.css')<styles.indexOf('BEGIN legacy-source: app/auryn-experience.css'));
});
