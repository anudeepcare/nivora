import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const publicEnv = {NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co/', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test'};
function load(file, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX},
  }).outputText;
  vm.runInNewContext(code, {exports, require, URL, AbortController, setTimeout, clearTimeout, ...globals});
  return exports;
}
function helper(options = {}) {
  return load('lib/social-auth-providers.ts', {
    process: {env: publicEnv},
    fetch: async () => { throw new Error('No network requests are allowed in these tests.'); },
    ...options,
  });
}
function component() {
  return load('components/auth/SocialAuth.tsx', {
    require(name) {
      if (name === '@/lib/supabase') return {supabaseBrowser: () => { throw new Error('OAuth must not start while rendering.'); }};
      if (name === '@/lib/social-auth-providers') return helper();
      return require(name);
    },
  });
}
const plain = value => JSON.parse(JSON.stringify(value));

test('initial social auth render offers email without unverified provider buttons', () => {
  const markup = renderToStaticMarkup(React.createElement(component().default));
  assert.doesNotMatch(markup, /<button/);
  assert.match(markup, /continue with email/i);
});

test('provider parsing accepts only explicit supported boolean capabilities', () => {
  const {parseSocialAuthProviders} = helper();
  assert.deepEqual(plain(parseSocialAuthProviders({external: {google: true, apple: true, github: true}})), ['google', 'apple']);
  assert.deepEqual(plain(parseSocialAuthProviders({external: {google: false, apple: true}})), ['apple']);
  assert.deepEqual(plain(parseSocialAuthProviders({external: {email: true}})), []);
  assert.deepEqual(plain(parseSocialAuthProviders({external: {google: false, apple: false}})), []);
  for (const invalid of [null, [], {}, {external: null}, {external: []}, {external: 'google'}, {external: {google: 'true'}}, {external: {google: true, apple: 1}}]) {
    assert.equal(parseSocialAuthProviders(invalid), null);
  }
});

test('settings request uses only the public API key and releases its timeout', async () => {
  const timers = new Set();
  const {loadSocialAuthProviders} = helper({
    setTimeout: callback => { timers.add(callback); return callback; },
    clearTimeout: timer => timers.delete(timer),
    fetch: async (url, options) => {
      assert.equal(url, 'https://example.supabase.co/auth/v1/settings');
      assert.equal(options.method, 'GET');
      assert.equal(options.headers.apikey, 'sb_publishable_test');
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(options.credentials, 'omit');
      assert.equal(options.cache, 'no-store');
      assert.equal(options.signal.aborted, false);
      return {ok: true, json: async () => ({external: {google: true, apple: false}})};
    },
  });
  assert.deepEqual(plain(await loadSocialAuthProviders()), ['google']);
  assert.equal(timers.size, 0);
});

test('legacy public anon keys remain supported', async () => {
  const {loadSocialAuthProviders} = helper({
    process: {env: {NEXT_PUBLIC_SUPABASE_URL: publicEnv.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-anon-test'}},
    fetch: async (_url, options) => {
      assert.equal(options.headers.apikey, 'public-anon-test');
      return {ok: true, json: async () => ({external: {apple: true}})};
    },
  });
  assert.deepEqual(plain(await loadSocialAuthProviders()), ['apple']);
});

test('missing or invalid public configuration never starts a request', async () => {
  for (const env of [{}, {NEXT_PUBLIC_SUPABASE_URL: publicEnv.NEXT_PUBLIC_SUPABASE_URL}, {...publicEnv, NEXT_PUBLIC_SUPABASE_URL: 'not a URL'}, {...publicEnv, NEXT_PUBLIC_SUPABASE_URL: 'file:///settings'}]) {
    let requested = false;
    const {loadSocialAuthProviders} = helper({process: {env}, fetch: async () => { requested = true; }});
    assert.equal(await loadSocialAuthProviders(), null);
    assert.equal(requested, false);
  }
});

test('HTTP, network, JSON and response-shape failures never enable providers', async () => {
  for (const fetch of [
    async () => ({ok: false, json: async () => ({external: {google: true}})}),
    async () => { throw new Error('offline'); },
    async () => ({ok: true, json: async () => { throw new SyntaxError('invalid JSON'); }}),
    async () => ({ok: true, json: async () => ({external: {google: 'true'}})}),
  ]) {
    assert.equal(await helper({fetch}).loadSocialAuthProviders(), null);
  }
});

test('timeout aborts a pending settings request and fails closed', async () => {
  let expire;
  let requestSignal;
  let cleared = false;
  const {loadSocialAuthProviders} = helper({
    setTimeout: (callback, delay) => { assert.equal(delay, 4000); expire = callback; return 1; },
    clearTimeout: () => { cleared = true; },
    fetch: async (_url, {signal}) => {
      requestSignal = signal;
      return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), {once: true}));
    },
  });
  const result = loadSocialAuthProviders();
  expire();
  assert.equal(await result, null);
  assert.equal(requestSignal.aborted, true);
  assert.equal(cleared, true);
});

test('caller cancellation aborts the request and removes its listener', async () => {
  const controller = new AbortController();
  const signal = controller.signal;
  const add = signal.addEventListener.bind(signal), remove = signal.removeEventListener.bind(signal);
  let attached = 0;
  signal.addEventListener = (...args) => { attached++; return add(...args); };
  signal.removeEventListener = (...args) => { attached--; return remove(...args); };
  const {loadSocialAuthProviders} = helper({fetch: async (_url, {signal}) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), {once: true}))});
  const result = loadSocialAuthProviders(signal);
  controller.abort();
  assert.equal(await result, null);
  assert.equal(attached, 0);
  let requested = false;
  assert.equal(await helper({fetch: async () => { requested = true; }}).loadSocialAuthProviders(signal), null);
  assert.equal(requested, false);
});

test('social options render exactly the enabled providers and keep the email path', () => {
  const {SocialAuthOptions} = component();
  for (const providers of [[], ['google'], ['apple'], ['google', 'apple']]) {
    const markup = renderToStaticMarkup(React.createElement(SocialAuthOptions, {providers, busy: '', error: '', unavailable: false, onLogin: () => {}}));
    assert.equal((markup.match(/<button/g) || []).length, providers.length);
    assert.equal(markup.includes('Continue with Google'), providers.includes('google'));
    assert.equal(markup.includes('Continue with Apple'), providers.includes('apple'));
    assert.match(markup, /continue with email/i);
  }
});

test('failed verification explains the email fallback without actionable social options', () => {
  const markup = renderToStaticMarkup(React.createElement(component().SocialAuthOptions, {providers: [], busy: '', error: '', unavailable: true, onLogin: () => {}}));
  assert.doesNotMatch(markup, /<button/);
  assert.match(markup, /role="status"/);
  assert.match(markup, /Please continue with email/);
});

test('starting OAuth disables all social choices and shows connecting status', () => {
  const markup = renderToStaticMarkup(React.createElement(component().SocialAuthOptions, {providers: ['google', 'apple'], busy: 'apple', error: '', unavailable: false, onLogin: () => {}}));
  assert.equal((markup.match(/disabled=""/g) || []).length, 2);
  assert.match(markup, /Connecting…/);
  assert.match(markup, /Continue with Google/);
});
