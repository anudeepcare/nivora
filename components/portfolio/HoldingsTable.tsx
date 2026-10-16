"use client";

import {useMemo, useState} from 'react';
import Link from 'next/link';
import {ArrowUpRight, ChevronDown, Pencil, Search, Trash2, Wallet} from 'lucide-react';
import AssetLogo from '@/components/AssetLogo';
import MetricHelp from '@/components/MetricHelp';
import {MarketLabel, money, quoteStatus} from './MarketLabel';
import {currentResearch, positivePrice, positionValue} from './valuation';

type Holding = {id: string | number; symbol: string; asset_type: string; shares: number | string; avg_cost?: number | string | null; currency?: string; horizon?: string; name?: string};
type Quotes = Record<string, any>;
type Sort = 'value' | 'symbol' | 'gain' | 'recent';

function holdingMetrics(row: Holding, quote: any) {
  const cash = row.asset_type === 'CASH';
  const usdCash = cash && String(row.currency || row.symbol).toUpperCase() === 'USD';
  const usdQuote = !quote?.market?.currency || String(quote.market.currency).toUpperCase() === 'USD';
  const price = cash ? usdCash ? 1 : null : usdQuote ? positivePrice(quote?.market?.displayPrice) : null;
  const rawValue = positionValue(row, quote?.market);
  const value = rawValue != null && Number.isFinite(rawValue) ? rawValue : null;
  const cost = row.avg_cost != null && String(row.avg_cost).trim() !== '' && Number.isFinite(Number(row.avg_cost)) && Number(row.avg_cost) >= 0 ? Number(row.avg_cost) : null;
  const basis = cost == null ? null : Number(row.shares) * cost;
  const pnl = cash || value == null || basis == null || !Number.isFinite(basis) ? null : value - basis;
  const pnlPct = pnl == null || basis == null || basis <= 0 ? null : pnl / basis * 100;
  return {cash, price, value, cost, pnl, pnlPct};
}

export function selectHoldings(rows: Holding[], quotes: Quotes, search: string, asset: string, sort: Sort) {
  const needle = search.trim().toLowerCase();
  const visible = rows.filter(row => (asset === 'ALL' || row.asset_type === asset) && `${row.symbol} ${row.name || ''} ${quotes[row.symbol]?.security?.name || ''}`.toLowerCase().includes(needle));
  if (sort === 'recent') return visible;
  return visible.sort((a, b) => {
    if (sort === 'symbol') return a.symbol.localeCompare(b.symbol);
    const first = holdingMetrics(a, quotes[a.symbol]), second = holdingMetrics(b, quotes[b.symbol]);
    const av = sort === 'gain' ? first.pnlPct : first.value, bv = sort === 'gain' ? second.pnlPct : second.value;
    if (av == null) return bv == null ? a.symbol.localeCompare(b.symbol) : 1;
    if (bv == null) return -1;
    return bv - av || a.symbol.localeCompare(b.symbol);
  });
}

const signedMoney = (value: number | null) => value == null ? '—' : `${value > 0 ? '+' : ''}${money(value)}`;
const actionLabel = (value: string | null | undefined, fallback: string) => value ? String(value).replaceAll('_', ' ') : fallback;
const horizonLabel = (value?: string) => value === 'short' ? 'Short term' : value === 'swing' ? 'Swing' : 'Long term';
const dateLabel = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString() : 'Timestamp unavailable';

export function HoldingRow({row, quote, now, busy, expanded, onToggle, onEdit, onRemove}: {
  row: Holding; quote?: any; now?: number; busy: boolean; expanded: boolean; onToggle: () => void;
  onEdit: (row: Holding) => void; onRemove: (row: Holding) => void;
}) {
  const {cash, price, value, cost, pnl, pnlPct} = holdingMetrics(row, quote);
  const priceStatus = quoteStatus(quote?.market, now);
  const priceCaption = cash ? price == null ? 'FX unavailable' : 'Recorded USD' : price == null ? 'Price unavailable' : priceStatus.current ? quote?.market?.priceState === 'OFFICIAL_CLOSE' ? 'Official close' : quote?.market?.session === 'CRYPTO_24X7' ? 'Live · 24/7' : 'Live price' : priceStatus.stale ? 'Stale · see details' : 'Unverified · see details';
  const research = currentResearch(quote?.research);
  const href = `/stock/${encodeURIComponent(row.symbol)}`;
  const name = quote?.security?.name || row.name;
  const detailId = `holding-details-${row.id}`;
  const quantity = Number(row.shares);
  const quantityLabel = Number.isFinite(quantity) ? quantity.toLocaleString(undefined, {maximumFractionDigits: 8}) : '—';
  const identity = <><AssetLogo symbol={row.symbol} name={name} logoUrl={quote?.security?.logoUrl || quote?.security?.logo} size={34}/><span className="pmHoldingIdentityText"><strong>{row.symbol}</strong><small>{name || (row.asset_type === 'CRYPTO' ? 'Crypto' : 'Stock')}<span className="pmHoldingHorizon"> · {horizonLabel(row.horizon)}</span><span className="pmHoldingMobileQuantity"> · {quantityLabel} {row.asset_type === 'CRYPTO' ? 'units' : 'shares'}</span></small></span></>;

  return <>
    <tr className="pmHoldingRow" data-symbol={row.symbol}>
      <td className="pmHoldingIdentity">
        {cash ? <div className="pmHoldingCash"><span className="pmCashIcon"><Wallet size={19}/></span><span><strong>{row.symbol} cash</strong><small>Recorded balance</small></span></div> : <Link className="pmHoldingLink" href={href} aria-label={`Open ${row.symbol} investment research`}>{identity}<ArrowUpRight className="pmHoldingLinkArrow" size={13} aria-hidden="true"/></Link>}
      </td>
      <td className="pmHoldingMetric pmHoldingPrice" data-label={cash ? 'Unit value' : 'Price'}><strong>{money(price)}</strong><small title={cash ? 'Recorded USD unit value' : priceStatus.label} className={!cash && price != null && !priceStatus.current ? 'pmHoldingPriceWarning' : undefined}>{priceCaption}</small></td>
      <td className="pmHoldingMetric pmHoldingQuantity" data-label="Position"><strong>{quantityLabel} <span className="pmHoldingUnit">{cash ? row.symbol : row.asset_type === 'CRYPTO' ? 'units' : 'shares'}</span></strong><small>{cash ? 'Cash balance' : `${money(cost)} avg. cost`}</small></td>
      <td className="pmHoldingMetric pmHoldingValue" data-label="Market value"><strong>{money(value)}</strong><small>{value == null ? cash ? 'FX unavailable' : 'Awaiting price' : cash ? 'USD cash' : 'Position value'}</small></td>
      <td className="pmHoldingMetric pmHoldingPnl" data-label="Unrealized P/L"><strong className={pnl == null ? undefined : pnl >= 0 ? 'pmPositive' : 'pmNegative'}>{signedMoney(pnl)}</strong><small className={pnlPct == null ? undefined : pnlPct >= 0 ? 'pmPositive' : 'pmNegative'}>{cash ? 'Not applicable' : value == null ? 'Awaiting price' : cost == null ? 'Cost unavailable' : pnlPct == null ? 'No cost basis' : `${pnlPct > 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}</small></td>
      <td className="pmHoldingControls"><div className="pmHoldingActions">
        {!cash && <button className="pmHoldingDetailsToggle" type="button" aria-label={`Research details for ${row.symbol}`} aria-expanded={expanded} aria-controls={detailId} onClick={onToggle}><ChevronDown size={16}/><span>Details</span></button>}
        <button type="button" aria-label={`Edit ${row.symbol}`} title={`Edit ${row.symbol}`} disabled={busy} onClick={() => onEdit(row)}><Pencil size={15}/></button>
        <button type="button" aria-label={`Remove ${row.symbol}`} title={`Remove ${row.symbol}`} disabled={busy} onClick={() => onRemove(row)}><Trash2 size={15}/></button>
      </div></td>
    </tr>
    {!cash && expanded && <tr className="pmHoldingDetailRow" id={detailId}><td colSpan={6}><div className="pmHoldingDetailContent">
      <div className="pmHoldingSource"><span className="pmHoldingDetailLabel">Price source & timing</span><MarketLabel market={quote?.market} now={now}/>{(quote?.quoteError || quote?.quoteRefreshError) && <p>{quote.quoteError || quote.quoteRefreshError}</p>}</div>
      <div><span className="pmHoldingDetailLabel">Owner call</span><strong>{actionLabel(research.ownerAction, 'Research pending')}</strong><small>Long term: {actionLabel(research.longTermAction, 'Awaiting evidence')}</small></div>
      <div><span className="pmHoldingDetailLabel">Research updated</span><strong>{dateLabel(quote?.research?.observedAt)}</strong><small>{quantityLabel} {row.asset_type === 'CRYPTO' ? 'units' : 'shares'} · {money(cost)} average cost · {horizonLabel(row.horizon)}</small></div>
      <Link className="pmHoldingResearchLink" href={href}>Open research <ArrowUpRight size={14}/></Link>
      {research.warning && <p className="pmHoldingWarning">{research.warning}</p>}
    </div></td></tr>}
  </>;
}

export default function HoldingsTable({rows, quotes, now, busy, onEdit, onRemove}: {rows: Holding[]; quotes: Quotes; now?: number; busy: boolean; onEdit: (row: Holding) => void; onRemove: (row: Holding) => void}) {
  const [search, setSearch] = useState('');
  const [asset, setAsset] = useState('ALL');
  const [sort, setSort] = useState<Sort>('value');
  const [expanded, setExpanded] = useState<string | number | null>(null);
  const visible = useMemo(() => selectHoldings(rows, quotes, search, asset, sort), [rows, quotes, search, asset, sort]);
  return <section className="pmCard pmHoldingsCard" aria-labelledby="holdings-heading">
    <div className="pmCardHead pmHoldingsHead"><div><h2 id="holdings-heading">Your holdings <span>{rows.length}</span></h2><p>Prices, positions and returns at a glance.</p></div><span className="pmHoldingsCurrency">All values in USD</span></div>
    <div className="pmHoldingsToolbar">
      <label className="pmHoldingSearch"><span className="pmSrOnly">Filter holdings</span><Search size={16} aria-hidden="true"/><input type="search" placeholder="Find a holding…" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <label><span className="pmSrOnly">Filter by asset type</span><select aria-label="Filter by asset type" value={asset} onChange={event => setAsset(event.target.value)}><option value="ALL">All assets</option><option value="EQUITY">Stocks</option><option value="CRYPTO">Crypto</option><option value="CASH">Cash</option></select></label>
      <label><span className="pmSrOnly">Sort holdings</span><select aria-label="Sort holdings" value={sort} onChange={event => setSort(event.target.value as Sort)}><option value="value">Largest value</option><option value="symbol">Symbol A–Z</option><option value="gain">Highest return %</option><option value="recent">Recently updated</option></select></label>
    </div>
    <div className="pmHoldingsMobileHelp" aria-label="Holding metric explanations"><span>Price <MetricHelp term="price"/></span><span>Value <MetricHelp term="marketValue"/></span><span>P/L <MetricHelp term="unrealizedPnl"/></span><span>Cost <MetricHelp term="averageCost"/></span></div>
    <table className="pmHoldingsTable"><caption className="pmSrOnly">Portfolio holdings with per-share prices, quantities, market values and unrealized returns</caption><thead><tr><th scope="col">Investment</th><th scope="col">Price <MetricHelp term="price"/></th><th scope="col">Position <MetricHelp term="averageCost"/></th><th scope="col">Market value <MetricHelp term="marketValue"/></th><th scope="col">Unrealized P/L <MetricHelp term="unrealizedPnl"/></th><th scope="col"><span className="pmSrOnly">Holding actions</span></th></tr></thead><tbody>{visible.map(row => <HoldingRow key={row.id} row={row} quote={quotes[row.symbol]} now={now} busy={busy} expanded={expanded === row.id} onToggle={() => setExpanded(expanded === row.id ? null : row.id)} onEdit={onEdit} onRemove={onRemove}/>)}</tbody></table>
    {!visible.length && <div className="pmHoldingsNoMatches"><p>No holdings match these filters.</p><button className="pmSecondary" onClick={() => {setSearch(''); setAsset('ALL');}}>Clear filters</button></div>}
    <p className="pmHoldingsFootnote">{visible.length === rows.length ? `${rows.length} positions` : `${visible.length} of ${rows.length} positions`} · Unrealized P/L compares the available price with your recorded average cost. Open details for price timing and research.</p>
  </section>;
}
