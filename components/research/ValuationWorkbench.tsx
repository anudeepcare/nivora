"use client";

import {useId,useState} from 'react';
import MetricHelp from '@/components/MetricHelp';
import {CASH_FLOW_PRESETS,VALUATION_METHOD_REFERENCES,calculateCashFlowScenario,extractValuationEvidence,type CashFlowAssumptions,type ValuationWorkbenchInput} from '@/lib/research-valuation-workbench';
import type {FinancialAssessment} from '@/lib/research-financial-assessment';

type ScenarioKey='bear'|'base'|'bull';
type Props=ValuationWorkbenchInput&{onOpenFinancials?:()=>void;financialAssessment?:FinancialAssessment|null};
const keys:ScenarioKey[]=['bear','base','bull'];
const money=(v:number|null)=>v===null?'Not available':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(v);
const compact=(v:number|null)=>v===null?'Not available':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(v);
const sharesText=(v:number|null)=>v===null?'Needs a dated count':`${new Intl.NumberFormat('en-US',{maximumFractionDigits:3}).format(v/1_000_000)}M`;
const pct=(v:number|null)=>v===null?'Comparison unavailable':`${v>=0?'+':''}${v.toFixed(1)}%`;
const assumptionFields:Array<{key:keyof CashFlowAssumptions;label:string;min:number;max:number;step:number;body:string}>=[
  {key:'growthPct',label:'Annual cash-flow growth',min:-50,max:50,step:.5,body:'Total company cash-flow growth in each of the next five years. This is your scenario assumption, not reported revenue growth or analyst consensus.'},
  {key:'discountRatePct',label:'Equity discount rate',min:.5,max:50,step:.5,body:'The annual return you require for this equity cash-flow risk. A higher rate lowers the present estimate. This is a cost-of-equity assumption, not WACC.'},
  {key:'terminalGrowthPct',label:'Terminal growth',min:-5,max:5,step:.25,body:'Perpetual annual total cash-flow growth after year five. It must be below the equity discount rate. Share dilution continues separately.'},
  {key:'dilutionPct',label:'Annual share dilution',min:0,max:25,step:.25,body:'Annual growth in the share denominator, including the terminal period. Review stock compensation and future financing. A 1% example is not a company forecast.'},
  {key:'cashDeductionPct',label:'Additional cash deduction',min:0,max:99,step:1,body:'The share of operating cash flow less capex withheld each year for net debt repayment, lease principal, acquisitions or other claims omitted from the starting measure. The example starts at zero; review the cash-flow statement.'},
];

function Workbench(props:Props) {
  const id=useId();
  const [selected,setSelected]=useState<ScenarioKey>('base');
  const [scenarios,setScenarios]=useState(()=>({...CASH_FLOW_PRESETS}));
  const [reviewedShares,setReviewedShares]=useState<ValuationWorkbenchInput['reviewedShares']>(null);
  const [shareDraft,setShareDraft]=useState<string|null>(null);
  const [shareDate,setShareDate]=useState('');
  const [shareError,setShareError]=useState('');
  const [edited,setEdited]=useState(false);
  const evidence=extractValuationEvidence({...props,reviewedShares});
  const canonical=props.financialAssessment?.valuation;
  const results={bear:calculateCashFlowScenario(evidence,scenarios.bear),base:calculateCashFlowScenario(evidence,scenarios.base),bull:calculateCashFlowScenario(evidence,scenarios.bull)};
  const active=results[selected];
  const displayCash=evidence.fcf!==null?evidence:evidence.reportedCashFlow;
  const reportedOnly=evidence.fcf===null&&evidence.reportedCashFlow!==null;
  const sourceReady=evidence.supported&&evidence.fcf!==null&&evidence.fcf>0;
  const rangeValues=keys.map(key=>results[key].estimatePerShare).filter((value):value is number=>value!==null&&Number.isFinite(value));
  const rangeInputs=evidence.price===null?rangeValues:[...rangeValues,evidence.price];
  const rangeMin=rangeInputs.length?Math.min(...rangeInputs):0,rangeMax=rangeInputs.length?Math.max(...rangeInputs):0;
  const rangePosition=(value:number)=>rangeMax===rangeMin?260:24+(value-rangeMin)/(rangeMax-rangeMin)*472;
  const countDraft=shareDraft??(evidence.shares!==null?String(evidence.shares/1_000_000):evidence.providerShares!==null?String(evidence.providerShares/1_000_000):'');
  const reset=()=>{setScenarios({...CASH_FLOW_PRESETS});setReviewedShares(null);setShareDraft(null);setShareDate('');setShareError('');setEdited(false);};
  const changeAssumption=(key:keyof CashFlowAssumptions,value:string)=>{
    setScenarios(previous=>({...previous,[selected]:{...previous[selected],[key]:value.trim()===''?NaN:Number(value)}}));setEdited(true);
  };
  const applyShares=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const value=Number(countDraft)*1_000_000;
    const trial=extractValuationEvidence({...props,reviewedShares:{value,asOf:shareDate}});
    if(trial.shares===null){setShareError('Enter a positive count and a date within the past 18 months. Future dates cannot be used.');return;}
    setReviewedShares({value,asOf:shareDate});setShareError('');setEdited(true);
  };
  return <section className="valuationWorkbench" aria-labelledby={`${id}-title`} data-auryn-section="valuation">
    <header className="valuationHeading">
      <div><span className="valuationEyebrow">CASH FLOW · FIVE-YEAR MODEL</span><h2 id={`${id}-title`}>Valuation scenarios</h2><p>Change the assumptions. See how the estimate responds.</p></div>
      <span className="valuationStatus">Exploratory model</span>
    </header>
    <div className="valuationBoundary"><MetricHelp term="Exploratory valuation" body="A calculation under explicit assumptions. It is separate from the verified valuation engine, has no independent cross-check and cannot change a buy decision or fair-value score. Verified fair value still requires independent source-backed validation."/><span>Exploratory scenarios · independent validation pending</span></div>

    <div className="valuationSourceMetrics">
      <div><span>Operating cash flow <MetricHelp term="operatingCashFlow"/></span><strong>{compact(displayCash?.operatingCashFlow??null)}</strong><small>{reportedOnly?'Reported consolidated amount':'Reported full year'}</small></div>
      <div><span>Capital expenditure <MetricHelp term="Capex" body="Cash spent on property, plant and equipment in this filing period. It is subtracted from operating cash flow here; acquisitions, lease principal and other cash claims require separate review."/></span><strong>{compact(displayCash?.capex??null)}</strong><small>Subtracted from cash flow</small></div>
      <div><span>{reportedOnly?'Reported FCF':'Free cash flow'} <MetricHelp term="freeCashFlow"/></span><strong>{compact(displayCash?.fcf??null)}</strong><small>{reportedOnly?'Excluded from current-business projection':'Operating cash flow − capex'}</small></div>
      <div><span>Share denominator <MetricHelp term="Diluted shares" body="The annual weighted-average diluted share count from the matching filing, or a dated count you reviewed. It can differ from current shares; subsequent issuance, buybacks and share-class changes need review."/></span><strong>{sharesText(evidence.shares)}</strong><small>{evidence.shareBasis==='USER_REVIEWED'?'Your reviewed count':evidence.shareBasis?'Annual diluted average':'Source evidence needed'}</small></div>
    </div>
    {displayCash?.sourceUrl&&<p className="valuationSourceLine"><a href={displayCash.sourceUrl} target="_blank" rel="noreferrer">SEC filing ↗</a><span>{displayCash.periodStart} to {displayCash.periodEnd} · Filed {displayCash.filedAt} · USD{reportedOnly?' · Reported figures only; continuing-business cash flow is not verified':''}</span></p>}

    {evidence.blockingReasons.length>0&&<div className="valuationUnavailable" role="status"><h3>{evidence.supported?'Complete the inputs to calculate scenarios':'This asset needs a different valuation method'}</h3><ul>{evidence.blockingReasons.map(reason=><li key={reason}>{reason}</li>)}</ul>{props.onOpenFinancials&&<button type="button" className="valuationTextButton" onClick={props.onOpenFinancials}>Review financial evidence →</button>}</div>}

    {sourceReady&&<>
      {rangeValues.length===3&&<figure className="valuationRange" aria-labelledby={`${id}-range-title`}>
        <figcaption id={`${id}-range-title`}>Scenario range <span>USD per share</span></figcaption>
        <svg viewBox="0 0 520 60" role="img" aria-label={`${keys.map(key=>`${key} ${money(results[key].estimatePerShare)}`).join(', ')}${evidence.price===null?'':`, market reference ${money(evidence.price)}`}. Positions follow the calculated values.`}>
          <line className="valuationRangeTrack" x1="24" y1="30" x2="496" y2="30"/>
          {evidence.price!==null&&<line className="valuationRangeReference" x1={rangePosition(evidence.price)} y1="7" x2={rangePosition(evidence.price)} y2="53"/>}
          {keys.map(key=><circle key={key} className={`valuationRangePoint ${key}`} cx={rangePosition(results[key].estimatePerShare!)} cy="30" r={selected===key?8:6}><title>{`${key} · ${money(results[key].estimatePerShare)}`}</title></circle>)}
        </svg>
        <div className="valuationRangeBounds"><span>{money(rangeMin)}</span><span>{money(rangeMax)}</span></div>
        <div className="valuationRangeLegend">{keys.map(key=><span key={key}><i className={key}/>{key}</span>)}{evidence.price!==null&&<span><i className="reference"/>Market reference</span>}</div>
      </figure>}
      <div className="valuationScenarioCards" aria-label="Scenario estimates">
        {keys.map(key=>{const result=results[key];return <button key={key} type="button" className={`valuationScenario ${key} ${selected===key?'selected':''}`} aria-pressed={selected===key} onClick={()=>setSelected(key)}>
          <span className="valuationScenarioName">{key} case <span>{selected===key?'Editing':'Edit assumptions'}</span></span>
          <strong>{result.estimatePerShare===null?'Needs inputs':money(result.estimatePerShare)}</strong>
          <span className="valuationScenarioDifference">{result.differenceFromPricePct===null?'Price comparison unavailable':`${pct(result.differenceFromPricePct)} vs reference price`}</span>
          <small>{Number.isFinite(scenarios[key].growthPct)?`${scenarios[key].growthPct}% growth`:'Set growth'} · {Number.isFinite(scenarios[key].discountRatePct)?`${scenarios[key].discountRatePct}% discount`:'Set discount'}</small>
        </button>})}
      </div>
      <div className="valuationReference"><span>{evidence.price!==null?`Market reference ${money(evidence.price)} · ${new Date(evidence.priceAsOf!).toISOString().replace('T',' ').slice(0,19)} UTC`:'No comparable, dated USD market reference'}</span><span>{edited?'Your edited assumptions':'Illustrative starting assumptions'}</span></div>
      <div className="valuationEditor">
        <div className="valuationEditorHeading"><div><h3>Edit the {selected} case</h3><p>Examples start at −5%, 0% and +5% growth. They are sensitivity tests, not company forecasts.</p></div><button type="button" className="valuationTextButton" onClick={reset}>Reset examples</button></div>
        <div className="valuationAssumptions">{assumptionFields.map(field=><div className="valuationAssumption" key={field.key}>
          <div><label htmlFor={`${id}-${field.key}`}>{field.label}</label><MetricHelp term={field.label} body={field.body}/></div>
          <div className="valuationNumberInput"><input id={`${id}-${field.key}`} type="number" inputMode="decimal" min={field.min} max={field.max} step={field.step} value={Number.isFinite(scenarios[selected][field.key])?scenarios[selected][field.key]:''} onChange={event=>changeAssumption(field.key,event.target.value)} aria-describedby={`${id}-assumption-note`}/><span>%</span></div>
        </div>)}</div>
        <p className="valuationCaption" id={`${id}-assumption-note`}>Five annual periods, then a perpetuity. Discounting uses an equity required return. No net new borrowing is assumed; review debt repayment and other claims in the cash deduction.</p>
        {active.errors.length>0&&evidence.blockingReasons.length===0&&<p role="alert" className="valuationInputError">{active.errors.join(' ')}</p>}
        {active.estimatePerShare!==null&&<div className="valuationModelSummary" aria-live="polite" aria-atomic="true"><span><b>{money(active.explicitPresentValuePerShare)}</b> first five years</span><span>+</span><span><b>{money(active.terminalPresentValuePerShare)}</b> terminal value</span><span>=</span><span><b>{money(active.estimatePerShare)}</b> estimate per share</span><small>{active.terminalWeightPct?.toFixed(0)}% of the estimate comes from the terminal value. Long-run assumptions materially affect the result.</small></div>}
      </div>

      <details className="valuationDetails" open={evidence.shares===null}>
        <summary>{evidence.shares===null?'Add the missing share count':'Review the share denominator'} <MetricHelp term="Diluted shares"/></summary>
        <p>SEC annual diluted shares average the reporting year. They can differ from today’s share count. Review subsequent dilution, buybacks, splits and share-class conversions.</p>
        {evidence.sharesAsOf&&<p>Using {sharesText(evidence.shares)} · {evidence.shareBasis==='USER_REVIEWED'?'reviewed as of':'annual period ended'} {evidence.sharesAsOf}.{evidence.shareSourceUrl&&<> <a href={evidence.shareSourceUrl} target="_blank" rel="noreferrer">Source filing ↗</a></>}</p>}
        {evidence.providerShares!==null&&<p>Finnhub profile reports {sharesText(evidence.providerShares)} shares; its observation date is not supplied. It is informational until you review the count and date.</p>}
        <form className="valuationShareForm" onSubmit={applyShares}>
          <label>Reviewed shares (millions)<input type="number" inputMode="decimal" min="0.000001" step="any" required value={countDraft} onChange={event=>setShareDraft(event.target.value)}/></label>
          <label>Share-count date<input type="date" required value={shareDate} max={(props.asOf??new Date().toISOString()).slice(0,10)} onChange={event=>setShareDate(event.target.value)}/></label>
          <button type="submit">Use reviewed shares</button>
        </form>
        {shareError&&<p className="valuationInputError" role="alert">{shareError}</p>}
        {reviewedShares&&<button type="button" className="valuationTextButton" onClick={()=>{setReviewedShares(null);setShareDraft(null);setShareDate('');}}>Return to reported shares</button>}
      </details>

      {active.projection.length>0&&<details className="valuationDetails"><summary>See the {selected} case calculation</summary>
        <p>Starting annual cash flow: {compact(evidence.fcf)}. Future amounts are assumptions. The cash deduction applies to every year; dilution also continues after year five.</p>
        <div className="valuationTableWrap" role="region" aria-label="Five-year cash-flow projection" tabIndex={0}><table><thead><tr><th scope="col">Forecast</th><th scope="col">Cash after deduction</th><th scope="col">Shares</th><th scope="col">Discounted value / share</th></tr></thead><tbody>{active.projection.map(row=><tr key={row.year}><th scope="row">Year {row.year}</th><td>{compact(row.cashFlow)}</td><td>{sharesText(row.shares)}</td><td>{money(row.presentValuePerShare)}</td></tr>)}</tbody></table></div>
        <p>Each year: starting cash flow × (1 − cash deduction) × (1 + growth)<sup>year</sup>, divided by starting shares × (1 + dilution)<sup>year</sup>, then discounted by (1 + equity discount rate)<sup>year</sup>.</p>
        <p>Terminal per-share growth = (1 + terminal total cash-flow growth) ÷ (1 + dilution) − 1. Terminal value = year-six cash per share ÷ (discount rate − terminal per-share growth), discounted for five years. No cash or debt balance is added or subtracted.</p>
      </details>}
    </>}
    <details className="valuationDetails valuationMethodNotes"><summary>Method, source quality & limitations</summary>
      <p>This is a five-year cash-flow sensitivity model for supported operating businesses with positive, comparable USD cash flow. The latest annual operating cash flow less capex is a starting proxy; it is not automatically cash distributable to shareholders. Interest is already reflected in US GAAP operating cash flow, while net borrowing, mandatory principal payments and other claims need separate review.</p>
      {evidence.warnings.map(warning=><p key={warning}>{warning}</p>)}
      <p>Stock-based compensation is not deducted from the reported cash starting point. Review dilution and any cash cost needed to offset it. The model does not automatically price options, preferred claims, acquisitions, ADR ratios or split adjustments.</p>
      <p>Bear/base/bull are editable labels. Estimates stay with their inputs even if you change their order. No independent peer, historical or forward-normalized cross-check is supplied.</p>
      <p><a href={VALUATION_METHOD_REFERENCES.cashFlow} target="_blank" rel="noreferrer">SEC: definition and limitations of free cash flow ↗</a><br/><a href={VALUATION_METHOD_REFERENCES.equityDiscounting} target="_blank" rel="noreferrer">NYU Stern: equity cash-flow discounting ↗</a></p>
    </details>
    {canonical&&<details className="researchCard valuationCanonical"><summary>Verified valuation evidence & model limits</summary><header className="valuationHeading"><div><span className="valuationEyebrow">SHARED RESEARCH ASSESSMENT</span><h2>Canonical valuation</h2><p>{canonical.method.replaceAll('_',' ')}</p></div><span className="valuationStatus">{canonical.decisionGrade?'Conditional policy estimates':'Evidence incomplete'}</span></header><p>{canonical.why}</p>
      {canonical.scenarios&&<><div className="valuationSourceMetrics">{keys.map(key=><div key={key}><span>{key} case</span><strong>{money(canonical.scenarios![key].value)}</strong><small>{canonical.scenarios![key].assumptions.growthPct}% cash growth · {canonical.scenarios![key].assumptions.discountRatePct}% equity discount rate</small></div>)}</div><p>Current listed-share denominator: {sharesText(canonical.shares)}. {canonical.scope} economics ended {canonical.periodEnd}. All future assumptions are AURYN policy estimates.</p>
        {canonical.impliedExpectations&&<p><strong>Price-implied cash-flow growth: </strong>{canonical.impliedExpectations.growthPct===null?'No solution between −50% and +50%.':`${canonical.impliedExpectations.growthPct.toFixed(1)}% annually for five years.`} All other base assumptions remain fixed. This is not a company forecast.</p>}
        <details className="valuationDetails"><summary>Independent method check and sensitivity</summary>{canonical.crossChecks.map(check=><p key={check.family}>{check.method}: {money(check.valuePerShare)}. {check.limitations}</p>)}<div className="valuationTableWrap" role="region" aria-label="Canonical cash-flow sensitivity" tabIndex={0}><table><thead><tr><th>Growth</th><th>Equity discount rate</th><th>Value / listed share</th></tr></thead><tbody>{canonical.sensitivity.map(row=><tr key={`${row.growthPct}-${row.discountRatePct}`}><td>{row.growthPct}%</td><td>{row.discountRatePct}%</td><td>{money(row.valuePerShare)}</td></tr>)}</tbody></table></div><p>{canonical.warnings.join(' ')}</p></details></>}
      {canonical.missingInputs.length>0&&<ul>{canonical.missingInputs.map((item,index)=><li key={`${item.metric}-${index}`}>{item.reason}</li>)}</ul>}
    </details>}
  </section>;
}

export default function ValuationWorkbench(props:Props){return <Workbench key={props.symbol} {...props}/>;}
