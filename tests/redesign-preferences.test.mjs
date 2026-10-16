import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePreferences,resolveTheme,safeDestination} from '../lib/appearance.mjs';
test('preferences normalize corrupt and legacy storage',()=>{
 assert.equal(normalizePreferences({theme:'racing'}).theme,'light');
 assert.equal(normalizePreferences({theme:'sapphire'}).theme,'dark');
 assert.equal(normalizePreferences({density:'broken'}).density,'comfortable');
 assert.equal(normalizePreferences({accent:'url(bad)'}).accent,'blue');
});
test('system mode follows the operating system',()=>{
 assert.equal(resolveTheme('system',true),'dark');
 assert.equal(resolveTheme('system',false),'light');
 assert.equal(resolveTheme('dark',false),'dark');
});
test('auth redirects only allow known local destinations',()=>{
 assert.equal(safeDestination('//evil.test'),'/dashboard');
 assert.equal(safeDestination('https://evil.test'),'/dashboard');
 assert.equal(safeDestination('/reset-password'),'/reset-password');
});
