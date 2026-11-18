import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Google icon has intrinsic dimensions even before auth styles arrive',()=>{
 const source=readFileSync('components/Session.tsx','utf8');
 const button=source.slice(source.indexOf('aria-label="Continue with Google"'),source.indexOf('<span>Continue with Google'));
 assert.match(button,/<svg\s+width="20"\s+height="20"/);
});
test('auth owns horizontal social-button layout and bounded icon instead of depending on legacy styles',()=>{
 const css=readFileSync('components/Session.module.css','utf8');
 assert.match(css,/\.auth \.main :global\(\.mp-social-button\)\s*\{\s*display: flex;\s*align-items: center;\s*justify-content: center;/);
 assert.match(css,/\.auth \.main :global\(\.mp-social-button\) > svg\s*\{\s*width: 20px;\s*height: 20px;\s*flex: 0 0 20px;/);
});
