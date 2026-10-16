import {createHash, timingSafeEqual} from 'node:crypto';
import {projectMarketIntelligence} from '../auryn/v934/projections';
import {INTELLIGENCE_POLICY_VERSION} from '../auryn/v931/domain';

type Environment=Record<string,string|undefined>;
export const PAPER_SCHEDULE='Every 15 minutes, weekdays 13:00–22:59 UTC; orders only in the regular market session';
export const PAPER_TERMINAL=['filled','canceled','expired','rejected','replaced'];
export function paperFillStatus(order:any,hasActivity=false){
 if(order?.broker_checked_at&&order.filled_quantity!=null&&Number.isFinite(Number(order.filled_quantity))){
  const filled=Number(order.filled_quantity),qty=Number(order.qty);
  return filled===0?'UNFILLED':qty>0&&filled===qty?'FILLED':filled>0&&filled<qty?'PARTIALLY_FILLED':'UNVERIFIED';
 }
 return hasActivity?'FILL_RECORDED_UNVERIFIED_TOTAL':null;
}
export function authorizePaperCron(req:Request,env:Environment=process.env){
 const secret=env.CRON_SECRET||env.TRADING_LAB_CRON_SECRET;
 if(!secret)return false;
 const actual=Buffer.from(req.headers.get('authorization')||''),expected=Buffer.from(`Bearer ${secret}`);
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
export function normalizePaperEvidence(snapshot:any,now=new Date()){
 const fail=(code:string)=>({ok:false,code,marketIntelligence:null as any});
 const age=now.getTime()-Date.parse(snapshot?.observed_at);
 if(!Number.isFinite(age)||age< -60_000||age>30*60_000)return fail('STALE_RESEARCH');
 const {v931:decision,v934:raw,v935:canonical}=snapshot?.evidence||{};
 if(snapshot?.evidence?.v995?.autonomous!==true||snapshot.evidence.v995.policyVersion!==INTELLIGENCE_POLICY_VERSION||decision?.policyVersion!==INTELLIGENCE_POLICY_VERSION)return fail('TRUSTED_AUTONOMOUS_PROVENANCE_REQUIRED');
 if(!canonical?.snapshotId||canonical.contract!=='AURYN_V9_3_5_CANONICAL_SNAPSHOT')return fail('V935_CANONICAL_SNAPSHOT_MISSING');
 if(!decision?.snapshotId||!decision.canonicalPrimaryAction)return fail('CANONICAL_DECISION_MISSING');
 if(!raw?.snapshotId||!raw.marketTruthSnapshotId)return fail('MARKET_INTELLIGENCE_MISSING');
 if(!canonical.marketSnapshotId||canonical.marketSnapshotId!==raw.marketTruthSnapshotId||canonical.researchSnapshotId!==decision.snapshotId)return fail('CANONICAL_PROVENANCE_MISMATCH');
 // Autonomous persistence stores raw canonical intelligence; earlier callers stored its projection.
 const projected=raw.confirmed||raw.summary?projectMarketIntelligence(raw):raw;
 const levels=projected?.levels;
 if(!levels||![levels.support,levels.invalidation,levels.confirm].some(x=>typeof x==='number'&&Number.isFinite(x)&&x>0))return fail('MARKET_INTELLIGENCE_MISSING');
 if(decision.executionAction!=='READY')return fail('CANONICAL_EXECUTION_BLOCKED');
 return {ok:true,code:'READY',marketIntelligence:projected};
}
export function paperSchedulerState({enabled,paused,session,lastAutomaticRun,now=new Date()}:{enabled:boolean;paused:boolean|null;session:string;lastAutomaticRun:any;now?:Date}){
 const at=lastAutomaticRun?.started_at||null,age=at?now.getTime()-Date.parse(at):null;
 const state=!enabled?'disabled':paused===null?'unavailable':paused?'paused':!at?'not-observed':session==='REGULAR'&&age!==null&&age>45*60_000?'overdue':'observed';
 return {state,scheduler:'GitHub Actions',schedule:PAPER_SCHEDULE,automatic:state==='observed',lastAutomaticRun:at,lastRunOk:lastAutomaticRun?lastAutomaticRun.status==='OK':null,lastRunCode:lastAutomaticRun?.error||null};
}
/** Broker availableQty is already net of open sells; new batch submissions are additional reservations. */
export function reservePaperCapacity(account:any,positions:any[],orders:any[],source:'broker'|'new'='broker'){
 if(!Number.isFinite(account?.equity)||account.equity<=0||!Number.isFinite(account?.cash)||!Number.isFinite(account?.buyingPower))throw Error('PAPER_ACCOUNT_CAPACITY_UNAVAILABLE');
 const next={...account},map=new Map<string,any>(positions.map(p=>[p.symbol,{...p}]));
 const seen=new Set<string>(),pendingSells=new Map<string,number>();
 for(const o of orders){
  if(seen.has(o.id))continue;seen.add(o.id);
  const qty=Math.max(0,Number(o.qty)-Number(o.filledQty||0));
  if(!Number.isFinite(qty))throw Error('PENDING_ORDER_QUANTITY_UNAVAILABLE');
  if(!qty||PAPER_TERMINAL.includes(String(o.status).toLowerCase()))continue;
  const symbol=String(o.symbol).toUpperCase(),p=map.get(symbol)||{symbol,qty:0,availableQty:0,marketValue:0,avgEntryPrice:0};
  if(String(o.side).toUpperCase()==='BUY'){
   const price=Number(o.limitPrice);if(!Number.isFinite(price)||price<=0)throw Error('PENDING_ORDER_PRICE_UNAVAILABLE');
   const reserved=qty*price;next.cash=Number(next.cash)-reserved;next.buyingPower=Math.min(Number(next.buyingPower??next.cash),next.cash);p.marketValue+=reserved;
  }else{
   const reserved=(pendingSells.get(symbol)||0)+qty;pendingSells.set(symbol,reserved);
   p.availableQty=Math.max(0,source==='new'
    ?Math.min(Number(p.qty),Number(p.availableQty??p.qty))-qty
    :Math.min(Number(p.availableQty??p.qty),Number(p.qty)-reserved));
  }
  map.set(symbol,p);
 }
 return {account:next,positions:[...map.values()]};
}
export async function assertPaperLease(db:any,owner:string){
 const {data,error}=await db.rpc('auryn_paper_lease',{p_owner:owner,p_operation:'renew'});
 if(error)throw Error('PAPER_CONTROL_UNAVAILABLE');if(data!==true)throw Error('PAPER_LEASE_LOST_OR_PAUSED');
}
export async function withPaperLease<T>(db:any,owner:string,work:()=>Promise<T>,observationOnly=false):Promise<T>{
 const {data,error}=await db.rpc('auryn_paper_lease',{p_owner:owner,p_operation:observationOnly?'observe':'acquire'});
 if(error)throw Error('PAPER_CONTROL_UNAVAILABLE');if(data!==true)throw Error('PAPER_BUSY_OR_PAUSED');
 try{return await work()}finally{await db.rpc('auryn_paper_lease',{p_owner:owner,p_operation:'release'}).catch(()=>undefined);}
}
export function stablePaperIntentId(snapshot:any,action:string){
 return `pi_${createHash('sha256').update(JSON.stringify([snapshot.evidence?.v931?.snapshotId,snapshot.evidence_fingerprint,action,'paper-risk-v2'])).digest('hex').slice(0,40)}`;
}
export async function recordPaperOrder(db:any,intent:any,plan:any,order:any){
 if(!order?.id||order.clientOrderId!==plan.clientOrderId||String(order.symbol).toUpperCase()!==String(plan.symbol).toUpperCase()||String(order.side).toUpperCase()!==plan.side)throw Error('BROKER_ORDER_IDENTITY_MISMATCH');
 if(order.qty!==plan.quantity||!Number.isFinite(order.filledQty)||order.filledQty<0||order.filledQty>order.qty||(order.status==='filled'&&order.filledQty!==order.qty)||(order.filledQty>0&&(!Number.isFinite(order.filledAvgPrice)||order.filledAvgPrice<=0)))throw Error('BROKER_ORDER_FILL_UNVERIFIED');
 const {error}=await db.from('nivora_v61_paper_orders').upsert({intent_id:intent.intent_id,broker:'alpaca',broker_order_id:order.id,client_order_id:plan.clientOrderId,symbol:order.symbol,side:order.side,qty:order.qty,limit_price:plan.limitPrice,status:order.status,submitted_at:order.submittedAt||null,order_payload:plan,broker_response:order,filled_quantity:order.filledQty,filled_avg_price:order.filledAvgPrice,broker_checked_at:new Date().toISOString()},{onConflict:'client_order_id'});
 if(error)throw Error('PAPER_ORDER_AUDIT_UNAVAILABLE');
 const result=await db.from('nivora_v61_trade_intents').update({status:PAPER_TERMINAL.includes(order.status)?order.status.toUpperCase():'SUBMITTED',client_order_id:plan.clientOrderId}).eq('intent_id',intent.intent_id);
 if(result.error)throw Error('PAPER_INTENT_AUDIT_UNAVAILABLE');
}
/** A unique intent claim precedes transmission. An ambiguous attempt is looked up, never resent. */
export async function submitAuditedPaperOrder({db,broker,intent,order,runId,assertLease}:{db:any;broker:any;intent:any;order:any;runId:string;assertLease:()=>Promise<void>}){
 const row={...intent,status:'SUBMITTING',client_order_id:order.clientOrderId,order_plan:order,run_id:runId};
 const claim=await db.from('nivora_v61_trade_intents').insert(row);
 if(claim.error){
  if(claim.error.code!=='23505')throw Error('PAPER_INTENT_AUDIT_UNAVAILABLE');
  const existing=await db.from('nivora_v61_trade_intents').select('*').eq('intent_id',intent.intent_id).maybeSingle();
  if(existing.error||!existing.data)throw Error('PAPER_INTENT_AUDIT_UNAVAILABLE');
  if(!existing.data.client_order_id||!existing.data.order_plan)return {status:'DUPLICATE',order:null};
  const found=await broker.getOrderByClientOrderId(existing.data.client_order_id);
  if(!found)return {status:'DUPLICATE',order:null};
  await recordPaperOrder(db,existing.data,existing.data.order_plan,found);return {status:'RECONCILED',order:found};
 }
 try{await assertLease()}catch(error){await db.from('nivora_v61_trade_intents').update({status:'BLOCKED_BEFORE_SUBMISSION'}).eq('intent_id',intent.intent_id);throw error;}
 let accepted:any;
 try{accepted=await broker.submitOrder(order)}catch(error:any){
  await db.from('nivora_v61_trade_intents').update({status:'UNKNOWN'}).eq('intent_id',intent.intent_id);
  const found=await broker.getOrderByClientOrderId(order.clientOrderId).catch(()=>null);
  if(!found){
   // A definitive validation/auth rejection is not a lost acknowledgement. Never retry it automatically.
   if([400,401,403,422].includes(error?.status)){
    const recorded=await db.from('nivora_v61_trade_intents').update({status:'REJECTED',risk_code:'BROKER_REJECTED',risk_reason:`Broker rejected the paper request (HTTP ${error.status}).`}).eq('intent_id',intent.intent_id);
    if(recorded.error)throw Error('PAPER_INTENT_AUDIT_UNAVAILABLE');
    throw Error('BROKER_REJECTED');
   }
   throw Error('PAPER_SUBMISSION_UNCERTAIN');
  }
  await recordPaperOrder(db,row,order,found);return {status:'RECONCILED',order:found};
 }
 await recordPaperOrder(db,row,order,accepted);return {status:'SUBMITTED',order:accepted};
}
export async function reconcilePaperOrders(db:any,broker:any){
 const result=await db.from('nivora_v61_trade_intents').select('*').in('status',['SUBMITTING','UNKNOWN','SUBMITTED']).order('created_at',{ascending:true}).limit(51);
 if(result.error)throw Error('PAPER_RECONCILIATION_STORAGE_UNAVAILABLE');
 const backlog=(result.data||[]).length>50,signal=AbortSignal.timeout(20_000);
 for(const row of (result.data||[]).slice(0,50)){
  if(!row.client_order_id||!row.order_plan)throw Error('PAPER_RECONCILIATION_REQUIRED');
  const found=await broker.getOrderByClientOrderId(row.client_order_id,signal);
  if(!found)throw Error('PAPER_SUBMISSION_UNCERTAIN');
  await recordPaperOrder(db,row,row.order_plan,found);
 }
 if(backlog)throw Error('PAPER_RECONCILIATION_BACKLOG');
 // A different user's manual ambiguity still consumes this shared account's capacity.
 const manual=await db.from('auryn_manual_paper_orders').select('id',{count:'exact',head:true}).in('status',['SUBMITTING','UNKNOWN']);
 if(manual.error)throw Error('MANUAL_PAPER_AUDIT_UNAVAILABLE');if(manual.count)throw Error('MANUAL_PAPER_RECONCILIATION_REQUIRED');
}
