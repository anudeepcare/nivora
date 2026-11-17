import test from'node:test';
import assert from'node:assert/strict';
import{nextSearchAction}from'../src/public/search-keyboard.js';

test('search keyboard navigation enters and wraps the canonical result list',()=>{assert.deepEqual(nextSearchAction('ArrowDown',-1,3),{action:'focus',index:0});assert.deepEqual(nextSearchAction('ArrowDown',2,3),{action:'focus',index:0});assert.deepEqual(nextSearchAction('ArrowUp',0,3),{action:'focus',index:2})});
test('search keyboard selects only an active result and cancels safely',()=>{assert.deepEqual(nextSearchAction('Enter',1,3),{action:'select',index:1});assert.deepEqual(nextSearchAction('Enter',-1,3),{action:'none',index:-1});assert.deepEqual(nextSearchAction('Escape',1,3),{action:'cancel',index:-1})});
test('search keyboard stays inert without provider results',()=>{assert.deepEqual(nextSearchAction('ArrowDown',-1,0),{action:'none',index:-1});assert.deepEqual(nextSearchAction('ArrowUp',2,-1),{action:'none',index:-1})});
