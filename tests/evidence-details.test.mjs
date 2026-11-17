import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
const mod={exports:{}};
const code=ts.transpileModule(fs.readFileSync('components/EvidenceDetails.tsx','utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
new Function('require','module','exports',code)(name=>name==='react/jsx-runtime'?jsx:{__esModule:true,default:{details:'details'}},mod,mod.exports);
const Details=mod.exports.default;
test('table context stays collapsed by default but retains complete accessible evidence and distinct action audiences',()=>{
 const reason='Full evidence stays available. '+ 'Long condition. '.repeat(30);
 const html=renderToStaticMarkup(React.createElement(Details,{reason,entry:'Wait for confirmation',holding:'Review size'}));
 assert.match(html,/<details class="details"><summary>/);
 assert.doesNotMatch(html,/<details[^>]*open/);
 assert.ok(html.includes(reason));assert.match(html,/New purchase/);assert.match(html,/Existing holding/);
 assert.match(html,/Wait for confirmation/);assert.match(html,/Review size/);
});
test('custom watchlist condition is preserved without inventing entry or holding claims',()=>{
 const html=renderToStaticMarkup(React.createElement(Details,{reason:'My custom condition',summary:'Your next condition'}));
 assert.match(html,/Your next condition/);assert.match(html,/My custom condition/);assert.doesNotMatch(html,/<dl>/);
});
test('workspace cells use one reusable context disclosure instead of concatenated paragraphs',()=>{
 for(const f of ['Discover','SupportingViews','WatchlistPage'])assert.match(fs.readFileSync(`components/${f}.tsx`,'utf8'),/<EvidenceDetails/);
 assert.match(fs.readFileSync('components/WatchlistPage.tsx','utf8'),/evidence.length > 140/);
 assert.match(fs.readFileSync('components/EvidenceDetails.module.css','utf8'),/focus-visible/);
});
