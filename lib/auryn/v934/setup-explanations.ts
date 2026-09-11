import type {InstitutionalNewMoneyAction} from '../v931/domain';

export type SetupExplanation={
  setup:string;
  title:string;
  meaning:string;
  actionImplication:string;
  confirmation:string;
  invalidation:string;
  setupIsNotAction:true;
};

const pretty=(s:string)=>String(s||'UNKNOWN').replaceAll('_',' ');
const money=(x:number|null|undefined)=>Number.isFinite(Number(x))?`$${Number(x).toFixed(2)}`:null;
const action=(x:InstitutionalNewMoneyAction|string)=>pretty(String(x)).toUpperCase();

export function describeSetupState(input:{setup:string|null|undefined;newMoneyAction:InstitutionalNewMoneyAction|string;confirm:number|null;invalidation:number|null}):SetupExplanation{
  const setup=String(input.setup||'UNKNOWN').toUpperCase();
  const confirm=money(input.confirm),risk=money(input.invalidation),a=action(input.newMoneyAction);
  let meaning='This is AURYN\'s classified market-structure state from confirmed price evidence.';
  let actionImplication=`The setup does not equal BUY or SELL by itself. Current new-money action: ${a}.`;
  let confirmation=confirm?`A completed bar through ${confirm} with supportive participation is the next confirmation test.`:'No decision-grade confirmation level is currently established.';
  let invalidation=risk?`The setup materially weakens below ${risk}.`:'No decision-grade structural invalidation is currently established.';

  switch(setup){
    case 'BREAKOUT_READY':
      meaning='Price is pressing a validated resistance area with supportive structure, but the breakout still needs confirmation.';
      actionImplication=a==='BUY'||a==='STRONG BUY'?`The broader policy currently supports ${a}; BREAKOUT READY is supporting evidence, not the reason by itself.`:`Wait for confirmation or a better entry. BREAKOUT READY is not an automatic BUY.`;
      confirmation=confirm?`A completed close above ${confirm} with supportive participation confirms the breakout.`:'A completed close above validated resistance with supportive participation confirms the breakout.';
      break;
    case 'BREAKOUT_WATCH':
      meaning='Price is approaching an important resistance/reclaim area, but structure or participation is not yet strong enough to call the breakout ready.';
      actionImplication=`Treat this as a watch state, not a BUY signal. Current new-money action: ${a}.`;
      break;
    case 'BREAKOUT_CONFIRMED':
      meaning='Price has closed through a validated resistance level with enough supporting structure to classify the breakout as confirmed.';
      actionImplication=`A confirmed breakout strengthens the technical case, but the investment action still depends on valuation, risk, fundamentals and entry quality. Current action: ${a}.`;
      break;
    case 'DOUBLE_BOTTOM':
      meaning='Price has tested a similar support area twice, suggesting sellers may be losing control and a reversal could be forming.';
      actionImplication=`This is a reversal candidate, not an automatic BUY. Current new-money action: ${a}.`;
      confirmation=confirm?`A completed close above the neckline/reclaim area near ${confirm} strengthens confirmation.`:'A completed close above the neckline/reclaim area strengthens confirmation.';
      break;
    case 'TREND_BREAKDOWN':
    case 'DAMAGED':
      meaning='Confirmed trend/structure has deteriorated and price is no longer behaving like a healthy advancing setup.';
      actionImplication=`New money should be cautious until structure repairs. This is not an automatic SELL for an existing owner; the broader thesis and risk policy still decide. Current action: ${a}.`;
      break;
    case 'REPAIRING':
      meaning='Previously damaged structure is improving, but the trend has not yet rebuilt enough evidence for a clean bullish setup.';
      actionImplication=`Treat this as early repair, not a BUY signal. Current new-money action: ${a}.`;
      break;
    case 'RECLAIM_ATTEMPT':
    case 'GAP_RECLAIM':
      meaning='Price is attempting to recover an important lost level. Holding the reclaim is more important than a brief intraday touch.';
      actionImplication=`This is confirmation-in-progress, not an automatic BUY. Current new-money action: ${a}.`;
      break;
    case 'BASE_BUILDING':
      meaning='Price is consolidating and building a potential base rather than trending decisively in either direction.';
      actionImplication=`A base can improve future risk/reward, but it requires a valid breakout/reclaim before it becomes actionable. Current action: ${a}.`;
      break;
    case 'RETEST_ENTRY':
      meaning='Price is retesting a previously reclaimed or broken level to see whether former resistance can hold as support.';
      actionImplication=`A successful retest can improve entry quality, but the broader policy still decides position size/action. Current action: ${a}.`;
      break;
    case 'TRENDING':
    case 'TREND_CONTINUATION':
      meaning='Confirmed structure remains in a healthy advancing trend with supportive directional evidence.';
      actionImplication=`Trend strength supports the case, but chasing can still be unattractive if entry quality or risk/reward is poor. Current action: ${a}.`;
      break;
    case 'WEAKENING':
    case 'FAILED_RECLAIM':
    case 'FAILED_BREAKOUT':
      meaning='A recent bullish/reclaim attempt is losing confirmation and the setup is weakening.';
      actionImplication=`Do not treat the prior bullish setup as intact without fresh confirmation. Current action: ${a}.`;
      break;
    case 'EARLY_REVERSAL':
    case 'CONFIRMED_REVERSAL':
    case 'INVERSE_HEAD_AND_SHOULDERS':
      meaning='Price structure is showing reversal evidence after a prior decline or damaged phase.';
      actionImplication=`Reversal structure can support a new-money case only when confirmation, participation and risk/reward also qualify. Current action: ${a}.`;
      break;
    case 'DISTRIBUTION':
    case 'HEAD_AND_SHOULDERS':
      meaning='Price structure is showing evidence of supply/distribution and weakening trend quality.';
      actionImplication=`This raises risk but is not an automatic SELL by itself; owner action still depends on thesis and invalidation. Current action: ${a}.`;
      break;
    case 'TRIANGLE_COMPRESSION':
      meaning='Price is compressing into a narrowing range. The eventual breakout direction matters more than the pattern label itself.';
      actionImplication=`Wait for directional confirmation unless the broader policy independently supports a starter position. Current action: ${a}.`;
      break;
  }
  return{setup,title:pretty(setup),meaning,actionImplication,confirmation,invalidation,setupIsNotAction:true};
}
