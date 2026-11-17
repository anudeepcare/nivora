import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = name => readFileSync(new URL('../components/' + name, import.meta.url), 'utf8');
test('public home never redirects an authenticated visitor away from the requested page', () => {
  assert.doesNotMatch(source('PublicLanding.tsx'), /router\.replace\("\/overview"\)/);
});
test('workspace brand returns to public home, distinct from Today navigation', () => {
  assert.match(source('Shell.tsx'), /href="\/"\s+className=\{experience\.brand\}/);
});
test('new public theme overrides the legacy carbon opening and green navigation CTA at equal specificity', () => {
  const css = source('PublicLanding.module.css');
  assert.match(css, /\.page\.page\.page :global\(\.ap-opening\)\s*\{[^}]*--ink:\s*inherit;[^}]*background:\s*transparent;/s);
  assert.match(css, /\.page\.page\.page \.header :global\(\.ap-button-primary\)\s*\{[^}]*background:\s*var\(--landing-accent\)/s);
});
test('reference auth keeps secondary options outside the primary two-field flow', () => {
  const auth = source('Session.tsx');
  assert.match(auth, /More sign-in options/);
  assert.match(auth, /Add your name \(optional\)/);
  assert.match(auth, /"Create workspace"/);
});
test('product guide uses the public semantic palette, not the discarded lime theme', () => {
  const css = source('PublicLanding.module.css');
  const guide = css.slice(css.indexOf('.demo {', css.indexOf('/* A distinct product stage')),
    css.indexOf('.previewCaption {', css.indexOf('/* A distinct product stage')));
  assert.doesNotMatch(guide, /#(?:d6f35a|ddf780|c9ec60|202b25|17221c|6ee7bf)\b/);
  const jsx = source('PublicLanding.tsx');
  assert.doesNotMatch(jsx, /(?:stroke|fill|stopColor)="#(?:d6f35a|6ee7bf|233631)"/);
});
