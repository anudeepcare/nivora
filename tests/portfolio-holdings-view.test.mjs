import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(file) {
  assert.ok(fs.existsSync(file), 'The holdings view must expose a renderable component.');
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true},
  }).outputText;
  const module = {exports: {}};
  const localRequire = name => {
    // Shared visual primitives do not affect navigation or portfolio arithmetic.
    if (name === '@/components/AssetLogo') return {__esModule: true, default: () => React.createElement('span', {'aria-hidden': true}, 'logo')};
    if (name === '@/components/MetricHelp') return {__esModule: true, default: () => null};
    if (name.startsWith('.')) {
      const base = path.resolve(path.dirname(file), name);
      return load(fs.existsSync(`${base}.tsx`) ? `${base}.tsx` : `${base}.ts`);
    }
    return require(name);
  };
  new Function('module', 'exports', 'require', compiled)(module, module.exports, localRequire);
  return module.exports;
}
const component = () => load('components/portfolio/HoldingsTable.tsx');
const holding = {id: 'holding-1', symbol: 'AAPL', asset_type: 'EQUITY', shares: 10, avg_cost: 100, horizon: 'long'};
const quote = {market: {displayPrice: 120, priceState: 'OFFICIAL_CLOSE', regularCloseAsOf: '2026-10-15T20:00:00Z'}, research: {state: 'READY', ownerAction: 'HOLD', longTermAction: 'ATTRACTIVE'}};
const rowProps = (row = holding, q = quote) => ({row, quote: q, busy: false, expanded: false, onToggle: () => {}, onEdit: () => {}, onRemove: () => {}});
const render = (row = holding, q = quote, extra = {}) => renderToStaticMarkup(React.createElement(component().HoldingRow, {...rowProps(row, q), ...extra}));
function nodes(node) {
  if (!React.isValidElement(node)) return [];
  return [node, ...React.Children.toArray(node.props.children).flatMap(nodes)];
}

test('holding identity links to its encoded research route without wrapping edit or remove actions', () => {
  const {HoldingRow} = component();
  const calls = [];
  const tree = HoldingRow({...rowProps({...holding, symbol: 'BTC/USD'}), onEdit: row => calls.push(['edit', row.symbol]), onRemove: row => calls.push(['remove', row.symbol])});
  const all = nodes(tree);
  const links = all.filter(node => node.props.href);
  assert.ok(links.some(link => link.props.href === '/stock/BTC%2FUSD'));
  for (const link of links) assert.equal(nodes(link).some(node => node.type === 'button'), false);
  all.find(node => node.props['aria-label'] === 'Edit BTC/USD').props.onClick();
  all.find(node => node.props['aria-label'] === 'Remove BTC/USD').props.onClick();
  assert.deepEqual(calls, [['edit', 'BTC/USD'], ['remove', 'BTC/USD']]);
  assert.ok(all.filter(node => node.type === 'tr').every(node => !node.props.onClick));
});

test('priced holding shows the share price, value and absolute plus percentage gain', () => {
  const html = render();
  assert.match(html, /\$120\.00/);
  assert.match(html, /\$1,200\.00/);
  assert.match(html, /\+\$200\.00/);
  assert.match(html, /\+20\.00%/);
  assert.doesNotMatch(html, /Owner call|Research as of/);
  assert.match(html, /aria-expanded="false"/);
});

test('missing quote never invents value or gains from average cost', () => {
  for (const displayPrice of [null, 0, -1, 'bad']) {
    const html = render(holding, {market: {displayPrice}});
    assert.match(html, /Price unavailable/);
    assert.match(html, /Awaiting price/);
    assert.doesNotMatch(html, /\$1,000\.00|\+0\.00%|\$0\.00/);
  }
});

test('missing cost and zero cost have distinct honest P/L states', () => {
  assert.match(render({...holding, avg_cost: null}), /Cost unavailable/);
  assert.doesNotMatch(render({...holding, avg_cost: null}), /\+\$1,200\.00|\+0\.00%/);
  const zero = render({...holding, avg_cost: 0});
  assert.match(zero, /\+\$1,200\.00/);
  assert.match(zero, /No cost basis/);
  assert.doesNotMatch(zero, /Infinity|NaN/);
});

test('USD cash remains recorded cash with no research link or investment gain', () => {
  const html = render({...holding, symbol: 'USD', asset_type: 'CASH', currency: 'USD', shares: 500, avg_cost: 1}, {});
  assert.match(html, /USD cash/);
  assert.match(html, /\$500\.00/);
  assert.match(html, /Not applicable/);
  assert.doesNotMatch(html, /href="\/stock\/|\+0\.00%|Research details/);
});

test('a foreign-currency quote is not mislabeled as a USD share price', () => {
  const html = render(holding, {...quote, market: {...quote.market, currency: 'EUR'}});
  assert.doesNotMatch(html, /\$120\.00|\$1,200\.00|\+\$200\.00/);
  assert.match(html, /Price unavailable/);
});

test('expanding details reveals canonical research and preserves stale warnings', () => {
  const html = render(holding, {...quote, research: {state: 'STALE_VERIFIED', ownerAction: 'BUY', observedAt: '2026-10-01T10:00:00Z'}}, {expanded: true});
  assert.match(html, /Research is stale/);
  assert.match(html, /Research pending/);
  assert.doesNotMatch(html, />BUY</);
  assert.match(html, /href="\/stock\/AAPL"/);
});

test('holdings filtering and value sorting keep unpriced positions last without changing the source order', () => {
  const {selectHoldings} = component();
  const rows = [holding, {...holding, id: '2', symbol: 'MSFT'}, {...holding, id: '3', symbol: 'BTC/USD', asset_type: 'CRYPTO'}];
  const quotes = {AAPL: quote, 'BTC/USD': {market: {displayPrice: 1000}}};
  assert.deepEqual(selectHoldings(rows, quotes, '', 'ALL', 'value').map(row => row.symbol), ['BTC/USD', 'AAPL', 'MSFT']);
  assert.deepEqual(selectHoldings(rows, quotes, 'aa', 'EQUITY', 'symbol').map(row => row.symbol), ['AAPL']);
  assert.deepEqual(rows.map(row => row.symbol), ['AAPL', 'MSFT', 'BTC/USD']);
});
