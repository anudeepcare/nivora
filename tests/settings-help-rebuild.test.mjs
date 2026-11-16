import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadGuide} from './helpers/product-guide.mjs';
test('help answers expand inline rather than hiding explanations behind a modal',()=>{
 const Guide=loadGuide();
 const html=renderToStaticMarkup(React.createElement(Guide,{topics:[{title:'Pace timing',text:'Missing history is not a sell signal.'}]}));
 assert.match(html,/<details/);assert.match(html,/<summary/);
 assert.ok(html.includes('Missing history is not a sell signal.'));
 assert.doesNotMatch(html,/<dialog/);
});
test('settings supplies section landmarks and collapses infrequent password changes',()=>{
 const source=fs.readFileSync('components/SupportingViews.tsx','utf8');
 for(const id of ['display-settings','research-settings','security-settings']) assert.ok(source.includes(`id="${id}"`));
 assert.match(source,/aria-label="Settings sections"/);
 assert.match(source,/<details className="settings-password-change">/);
 assert.match(source,/signOutAndRedirect/);assert.match(source,/auth\.updateUser/);
});
test('help gets a dedicated open layout while legal content retains version metadata',()=>{
 const source=fs.readFileSync('components/LegalDocument.tsx','utf8');
 assert.match(source,/styles\.helpCenter/);assert.match(source,/data-document-version/);
 assert.match(source,/PwaDiagnostics/);
});
