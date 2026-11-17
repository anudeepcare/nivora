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
