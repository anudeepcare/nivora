import {previewAllocation, type PlanningEvidence, type Multiplier, PLANNING_POLICY_VERSION} from './policy';
import {previewPurchase} from './portfolio';
export type ReplayBar={at:string;price:number};
export type ReplayDecision={knownAt:string;multiplier:Multiplier;evidence:PlanningEvidence;modelVersion:string};
export type ReplayInput={bars:ReplayBar[];contributions:{at:string;amount:number}[];decisions:ReplayDecision[];contribution:number;initialCash:number;feeFixed:number;feeBps:number;slippageBps:number;maxPositionPct:number;policyVersion:string;strategy?:'recurring'|'tactical'};
const timestamp=(value:string)=>Date.parse(value);
function validate(input:ReplayInput){
  if(!input.bars.length)throw new Error('At least one execution observation is required.');
  if(!input.policyVersion||![input.contribution,input.initialCash,input.feeFixed,input.feeBps,input.slippageBps,input.maxPositionPct].every(n=>Number.isFinite(n)&&n>=0)||input.contribution<=0||input.maxPositionPct>100)throw new Error('Valid cash, costs, contribution, cap and policy version are required.');
  for(let i=0;i<input.bars.length;i++){const bar=input.bars[i];if(!Number.isFinite(timestamp(bar.at))||!Number.isFinite(bar.price)||bar.price<=0||(i>0&&timestamp(bar.at)<=timestamp(input.bars[i-1].at)))throw new Error('Execution observations require positive prices in strictly increasing chronological order.');}
  for(const flow of input.contributions)if(!Number.isFinite(timestamp(flow.at))||!Number.isFinite(flow.amount)||flow.amount<0)throw new Error('Contributions require an availability timestamp and nonnegative amount.');
  for(const decision of input.decisions)if(!decision.modelVersion||!Number.isFinite(timestamp(decision.knownAt))||!Number.isFinite(timestamp(decision.evidence.knownAt))||timestamp(decision.evidence.knownAt)>timestamp(decision.knownAt))throw new Error('Decision evidence must be published by its decision timestamp and have a model version.');
}
function run(input:ReplayInput,fixed:boolean){
  let cash=input.initialCash,shares=0,contributions=input.initialCash,costs=0,traded=0,navUnits=input.initialCash,peak=1,maxDrawdown=0,flowIndex=0,covered=0,abstained=0;
  const flows=[...input.contributions].sort((a,b)=>timestamp(a.at)-timestamp(b.at));
  const decisions=[...input.decisions].sort((a,b)=>timestamp(a.knownAt)-timestamp(b.knownAt));
  let decisionIndex=0,lastDecision:ReplayDecision|undefined;
  const rows=input.bars.map(bar=>{
    let total=cash+shares*bar.price;
    let nav=navUnits>0?total/navUnits:1;
    peak=Math.max(peak,nav);maxDrawdown=Math.max(maxDrawdown,peak>0?(peak-nav)/peak:0);
    let deposit=0;
    while(flowIndex<flows.length&&timestamp(flows[flowIndex].at)<=timestamp(bar.at)){deposit+=flows[flowIndex++].amount;}
    if(deposit>0){navUnits+=deposit/(nav>0?nav:1);cash+=deposit;total+=deposit;contributions+=deposit;}
    // Strictly earlier knowledge is required. A close-derived signal cannot fill at that close.
    while(decisionIndex<decisions.length&&timestamp(decisions[decisionIndex].knownAt)<timestamp(bar.at))lastDecision=decisions[decisionIndex++];
    let amount=0,reason='No then-available decision';
    if(fixed){amount=Math.min(input.contribution,cash,Math.max(0,total*input.maxPositionPct/100-shares*bar.price));reason='Fixed 1x benchmark under identical cash, costs and exposure cap';}
    else if(lastDecision){
      covered++;
      const preview=previewAllocation({contribution:input.contribution,requestedMultiplier:lastDecision.multiplier,strategy:input.strategy||'recurring',cadence:'monthly',budgetCap:input.contribution*4,cashAvailable:cash,portfolioValue:total,positionValue:shares*bar.price,maxPositionPct:input.maxPositionPct,reviewDate:bar.at.slice(0,10),paused:false,pauseConditions:[],asOf:bar.at},lastDecision.evidence);
      amount=preview.amount;reason=preview.reasons.join(' ');
    }
    const fill=previewPurchase({cash,totalValue:total,positionValue:shares*bar.price,amount,price:bar.price,feeFixed:input.feeFixed,feeBps:input.feeBps,slippageBps:input.slippageBps});
    const spent=fill.valid?amount:0;
    if(fill.valid){cash=fill.cashAfter!;shares+=fill.units!;costs+=fill.costs!;traded+=fill.marketValueAdded!;}
    else reason=fill.reason;
    if(spent===0)abstained++;
    total=cash+shares*bar.price;nav=navUnits>0?total/navUnits:1;peak=Math.max(peak,nav);maxDrawdown=Math.max(maxDrawdown,peak>0?(peak-nav)/peak:0);
    return {at:bar.at,price:bar.price,deposit,spent,cash,shares,total,nav,reason,decisionKnownAt:fixed?null:lastDecision?.knownAt??null,modelVersion:fixed?'fixed-dca-v1':lastDecision?.modelVersion??null};
  });
  const endingValue=rows.at(-1)!.total,averageEquity=rows.reduce((sum,row)=>sum+row.total,0)/rows.length;
  return {rows,endingValue,contributions,profit:endingValue-contributions,idleCash:cash,costs,maxDrawdownPct:maxDrawdown*100,returnPct:navUnits>0?(rows.at(-1)!.nav-1)*100:null,returnOnContributionsPct:contributions>0?(endingValue-contributions)/contributions*100:null,turnoverPct:averageEquity>0?traded/averageEquity*100:0,sampleSize:rows.length,coveragePct:fixed?100:covered/rows.length*100,abstentionPct:abstained/rows.length*100};
}
/** Bars are explicit scheduled execution observations, not an automatically reconstructed cadence. Prices must use one consistent split basis. */
export function compareDca(input:ReplayInput){
  validate(input);
  return {fixed:run(input,true),candidate:run(input,false),mode:'OBSERVATION_ONLY' as const,policyVersion:input.policyVersion,implementationVersion:PLANNING_POLICY_VERSION,investmentPerformanceValidated:false as const,calibration:null,
    limitations:['Single supplied asset and execution schedule; no point-in-time universe or delisted-asset dataset is verified. Survivorship and selection bias are unresolved.','Only supplied evidence publication times are checked; input vendor revisions and model training provenance need independent audit.','Fractional shares are assumed. Costs include supplied fixed fees, fee basis points and adverse slippage; taxes, dividends, cash interest, splits and broker constraints are not modeled.','Return is unitized time-weighted return; profit is ending value less all contributed capital. Drawdown uses unitized value, so deposits cannot conceal losses.','Turnover is gross marked value purchased divided by average portfolio value; this buy-only comparison is not annualized.','Historical simulations and software tests do not validate future investment performance.']};
}
export type WalkForwardWindow={name:string;trainThrough:string;testFrom:string;testThrough:string;finalHoldout?:boolean};
/** Evaluates already-frozen candidate decisions. It does not fit, tune, select or promote a model. */
export function evaluateWalkForward(input:ReplayInput,windows:WalkForwardWindow[]){
  let previousEnd=-Infinity;
  const folds=windows.map((window,index)=>{
    const from=timestamp(window.testFrom),through=timestamp(window.testThrough),train=timestamp(window.trainThrough);
    if(![from,through,train].every(Number.isFinite)||train>=from||through<from||from<=previousEnd)throw new Error('Training must precede each nonoverlapping test window.');
    if(window.finalHoldout&&index!==windows.length-1)throw new Error('The final holdout must be last.');
    previousEnd=through;
    const bars=input.bars.filter(bar=>timestamp(bar.at)>=from&&timestamp(bar.at)<=through);
    const contributions=input.contributions.filter(flow=>timestamp(flow.at)>=from&&timestamp(flow.at)<=through);
    const decisions=input.decisions.filter(decision=>timestamp(decision.knownAt)<=through);
    return {...window,comparison:compareDca({...input,bars,contributions,decisions})};
  });
  return {folds,promotion:'REQUIRES_REVIEW' as const,mode:'OBSERVATION_ONLY' as const,finalHoldoutPresent:windows.some(window=>window.finalHoldout),limitations:['Each fold resets to the same initial cash and includes only that fold’s contribution availability. Fold returns are not stitched.','Training cutoff and holdout designation are declarations; caller must separately audit model training and prohibit tuning against holdout outcomes.']};
}
