import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('published-reference navigation and cockpit visual system are represented', async () => {
  const [html, baseCss, cockpitCss, js] = await Promise.all([
    fs.readFile(new URL('../src/public/index.html', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/public/styles.css', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/public/cockpit.css', import.meta.url), 'utf8'),
    fs.readFile(new URL('../src/public/app.js', import.meta.url), 'utf8'),
  ]);
  const css = baseCss + cockpitCss;

  for (const label of ['Today', 'Research', 'Discover', 'Compare', 'Watchlist', 'Portfolio']) {
    assert.match(js, new RegExp(`['"]${label.toLowerCase()}['"]\\s*,\\s*['"]${label}['"]`));
  }
  for (const token of ['--cockpit', '--cyan', '--violet', 'DM Mono', 'Manrope']) assert.match(css, new RegExp(token));
  assert.match(html, /PUBLISHED FIGMA REFERENCE · PROVISIONAL DATA/);
  assert.match(css, /@media\(max-width:760px\)/);
});

test('reference-inspired fixture screens never label offline numbers live', async () => {
  const js = await fs.readFile(new URL('../src/public/app.js', import.meta.url), 'utf8');
  assert.match(js, /OFFLINE REFERENCE FIXTURE/);
  assert.doesNotMatch(js, /LIVE · 3:42:18 PM ET/);
});
