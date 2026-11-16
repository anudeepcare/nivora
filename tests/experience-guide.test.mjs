import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as icons from 'lucide-react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadGuide} from './helpers/product-guide.mjs';
test('guide has task navigation, searchable topics and distinct methodology link',()=>{
 assert.ok(fs.existsSync('components/ProductGuide.tsx'),'task-led guide exists');
 const Guide=loadGuide();
 const html=renderToStaticMarkup(React.createElement(Guide,{topics:[{title:'AURYN Pace',text:'A missing level is not P0.'}]}));
 for(const text of ['Find your next step','Find a topic','A missing level is not P0.','/research','/portfolio','/watchlist','/methodology'])assert.ok(html.includes(text),text);
 assert.match(html,/type="search"/);
});
test('help uses guide without replacing policy sections',()=>{
 const source=fs.readFileSync('components/LegalDocument.tsx','utf8');
 assert.match(source,/ProductGuide/);
 assert.match(source,/id === "help"/);
 assert.match(source,/data-document-version/);
});
test('portfolio glass remains bounded and honors transparency preference',()=>{
 const css=fs.readFileSync('components/PortfolioWorkspace.module.css','utf8');
 assert.match(css,/\.balanceDeck\s*\{[^}]*background: var\(--workspace-panel\)/s);
 assert.match(css,/prefers-reduced-transparency/);
});
