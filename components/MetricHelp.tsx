"use client";
import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {CircleHelp, X} from 'lucide-react';

const glossary: Record<string, [string, string]> = {
  capex: ['Capital expenditure', 'Cash spent on property, equipment and other capital assets during the reported period. The workbench subtracts compatible cash capex from operating cash flow; accounting depreciation is not cash capex.'],
  dilutedShares: ['Diluted shares', 'The share denominator includes potentially dilutive securities under the reporting rules. An annual weighted average is not necessarily today’s outstanding count. Subsequent issuance, buybacks, splits and share classes can change per-share value.'],
  netMargin: ['Net margin', 'Net income divided by revenue for the same reporting period and accounting scope. It describes the share of sales retained as reported earnings. One-time or discontinued-operation gains can distort it.'],
  operatingMargin: ['Operating margin', 'Operating income divided by revenue for the same period. It measures operating profitability before financing and tax effects; compare accounting definitions and business models carefully.'],
  totalAssets: ['Total assets', 'The balance-sheet assets recognized at the reporting date. Book value is not necessarily current market value. Compare assets with liabilities and the cash flows they can generate.'],
  totalLiabilities: ['Total liabilities', 'The obligations recognized on the reported balance sheet. This includes more than financial debt. Maturity, interest costs, liquidity and off-balance-sheet commitments matter alongside the total.'],
  price: ['Price & freshness', 'The latest available provider quote, with its original timestamp. Live, official close, delayed and stale prices are different states. Open source details before relying on an old quote. A displayed price alone does not authorize a trade.'],
  marketValue: ['Market value', 'Units held × available price. Cash is included at its recorded USD balance. Missing prices are excluded from known value; they are not treated as zero-value investments. This is a valuation estimate, not an executable sale price.'],
  unrealizedPnl: ['Unrealized profit / loss', 'Market value minus units × your recorded average cost. Percentage return divides this difference by cost basis. It excludes realized gains, dividends, fees and taxes, and depends on complete, accurate position records.'],
  averageCost: ['Position & average cost', 'Position is the number of shares or crypto units recorded. Average cost is the purchase cost per unit you entered. A missing cost basis cannot produce a reliable investment return.'],
  revenue: ['Revenue', 'Sales recognized during the stated reporting period, before expenses. Compare equivalent periods and check acquisitions, discontinued operations and currency effects before interpreting growth.'],
  netIncome: ['Net income', 'Reported earnings after expenses, interest and taxes. Accounting gains, restructuring and discontinued operations can distort the result. Read the accounting basis alongside the number.'],
  operatingCashFlow: ['Operating cash flow', 'Cash generated or used by operations during the reported period. It includes working-capital movements and is measured before capital expenditure. It is not free cash flow.'],
  freeCashFlow: ['Free cash flow', 'Operating cash flow minus cash capital expenditure for the same reported period and currency. It may differ from company-adjusted FCF and can include stock-based compensation effects. Negative cash flow is not suitable for a simple positive-FCF valuation.'],
  fcfYield: ['Free cash flow yield', 'Annual free cash flow ÷ equity market value. A higher yield may indicate a lower price, but may also reflect weak growth or elevated risk. It requires compatible share, cash-flow and price data; operating cash flow alone cannot substitute for FCF.'],
  fairValue: ['Fair value', 'A model estimate based on business cash flows and explicit assumptions. It is not a guaranteed future price. A verified value requires sufficient independent evidence; an exploratory scenario does not change the canonical investment decision.'],
  marginOfSafety: ['Margin of safety', '(Estimated fair value − price) ÷ estimated fair value. Positive means the price is below that estimate. It is only as reliable as the valuation assumptions and price timestamp.'],
  business: ['Business quality', 'A model assessment of growth, profitability, cash generation, balance-sheet resilience and durability. Missing evidence lowers confidence. The score is not a probability of profit and does not establish a competitive moat.'],
  moat: ['Competitive moat', 'A durable advantage such as switching costs, network effects, pricing power or a structural cost advantage. A moat needs dated evidence from company disclosures and competitors; a high growth rate or rising share price alone is insufficient.'],
  valuation: ['Valuation', 'Compare the price with an estimate of business value using explicit assumptions and the appropriate model. Technical support levels and Fibonacci targets are not fair value.'],
  timing: ['Market timing', 'Trend, momentum, participation and price structure help assess entry conditions. They describe market behavior and can change quickly; they do not independently prove or break a business thesis.'],
  rsi: ['RSI · 14 periods', 'A momentum oscillator comparing recent average gains with average losses on a 0–100 scale. Readings above 70 or below 30 are common reference zones, not automatic sell or buy signals. Strong trends can remain at extremes.'],
  macd: ['MACD histogram', 'The difference between the MACD line and its signal line. Changes describe momentum; the number is in price units and is not directly comparable across companies. Crossovers can produce false signals.'],
  volume: ['Relative volume', 'Trading volume divided by its 20-day average. A value of 1 means typical volume; 2 means twice the average. Intraday and completed-session volumes are not directly comparable.'],
  atr: ['Average true range %', 'Typical recent trading range, including gaps, expressed relative to price. It describes volatility, not direction. It can help contextualize position risk but does not guarantee a stop will fill at a chosen price.'],
  volatility: ['Realized volatility', 'Variation in historical returns over the calculation window. It describes past price variability, not future loss limits. Interpret it using the period and annualization convention used by the source.'],
  drawdown: ['52-week drawdown', 'The decline from the reference high in the 52-week window, expressed as a percentage. A large drawdown alone does not mean a security is undervalued or ready to recover.'],
};

export default function MetricHelp({term, title, body}: {term:string; title?:string; body?:string}) {
  const id = useId(), dialog = useRef<HTMLDialogElement>(null);
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const normalized=term.replace(/[^a-z0-9]/gi,'').toLowerCase();
  const aliases:Record<string,string>={fcf:'freeCashFlow',freecashflowyield:'fcfYield',capitalexpenditure:'capex',revenuegrowth:'revenue',cashflow:'operatingCashFlow'};
  const entry = glossary[aliases[normalized]||term] || Object.entries(glossary).find(([key])=>key.toLowerCase()===normalized)?.[1];
  const heading = title || entry?.[0] || term;
  const explanation = body || entry?.[1] || 'This model score summarizes the available evidence on a 0–100 scale. It is not a probability of profit. Missing inputs, the measurement window and source quality affect confidence; review the underlying evidence before acting.';
  return <>
    <button type="button" className="metricHelpButton" aria-label={`About ${heading}`} aria-haspopup="dialog" onClick={event => {event.preventDefault(); event.stopPropagation(); dialog.current?.showModal();}}><CircleHelp size={15} aria-hidden="true"/></button>
    {mounted && createPortal(<dialog className="metricHelpDialog" ref={dialog} aria-labelledby={id} onClick={event => {event.stopPropagation(); if (event.target === dialog.current) dialog.current?.close();}}>
      <div className="metricHelpContent"><header><span>Understand this metric</span><button type="button" className="metricHelpClose" aria-label="Close explanation" onClick={() => dialog.current?.close()}><X size={20}/></button></header><h2 id={id}>{heading}</h2><p>{explanation}</p><button type="button" className="metricHelpDone" onClick={() => dialog.current?.close()}>Got it</button></div>
    </dialog>,document.body)}
  </>;
}
