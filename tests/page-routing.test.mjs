import test from 'node:test';import assert from 'node:assert/strict';import {isProductPage} from '../lib/page-routing.ts';
test('only known public and workspace routes are accepted as pages',()=>{
 for(const path of ['/','/about','/pace','/research','/research/BRK.B','/preview/research/MSFT','/preview/settings'])assert.equal(isProductPage(path),true,path);
 for(const path of ['/nonsense','/research/MSFT/junk','/settings/junk','/preview/nonsense'])assert.equal(isProductPage(path),false,path);
});
test('only implemented authentication endpoints bypass the page-not-found gate',()=>{
 assert.equal(isProductPage('/auth/callback'),true);
 assert.equal(isProductPage('/auth/confirm'),true);
 assert.equal(isProductPage('/auth/anything'),false);
 assert.equal(isProductPage('/auth/callback/extra'),false);
});
