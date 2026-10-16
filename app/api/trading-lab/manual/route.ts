import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {authorizeRequest} from '@/lib/server/authorization';
import {AlpacaPaperBroker} from '@/lib/alpaca-paper';
import {loadCanonicalMarketSnapshot} from '@/lib/auryn/market-data-gateway';
import {validateManualTicket,checkManualRisk,manualClientOrderId,manualOrderSnapshot,isManualTerminal,canCancelManualOrder} from '@/lib/manual-paper.mjs';
import {rateLimitDistributed,requestKey} from '@/lib/rate-limit';
export const dynamic='force-dynamic';
const json=(data:any,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store'}});
function database(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;return url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;}
const auditColumns='id,symbol,side,quantity,limit_price,status,broker_order_id,created_at,detail,filled_quantity,filled_avg_price,broker_checked_at,cancel_requested_at,cancel_status';
const storedOrder=(row:any,note:string,reconciliation='unavailable')=>({...row,canCancel:false,reconciliation,reconciliationNote:note});
async function reconcileOrder(db:any,broker:AlpacaPaperBroker,userId:string,row:any,signal?:AbortSignal){
 try{
  const order=row.broker_order_id?await broker.getOrder(row.broker_order_id,signal):await broker.getOrderByClientOrderId(manualClientOrderId(row.id),signal);
  if(!order)return storedOrder(row,'No matching broker order was found. This does not prove that submission failed. Do not place a replacement order.','not-found');
  const patch=manualOrderSnapshot(row,order);
  let update=db.from('auryn_manual_paper_orders').update(patch).eq('id',row.id).eq('user_id',userId);
  // An overlapping refresh must not overwrite a newer recorded broker response.
  update=row.broker_checked_at?update.eq('broker_checked_at',row.broker_checked_at):update.is('broker_checked_at',null);
  const {data,error}=await update.select(auditColumns).maybeSingle();
  if(error||!data)return storedOrder(row,'Broker status could not be safely recorded. Refresh before taking another action.','unrecorded');
  return {...data,canCancel:canCancelManualOrder(data),reconciliation:'verified',reconciliationNote:'Verified against Alpaca Paper.'};
 }catch{return storedOrder(row,'Broker status could not be verified. The displayed record may be out of date. Refresh or check Alpaca Paper.');}
}
export async function GET(req:Request){
 const auth=await authorizeRequest(req,true);if(auth.response)return auth.response;
 const rate=await rateLimitDistributed(`manual-paper-status:${auth.user.id}:${requestKey(req)}`,30,60000);if(!rate.ok)return json({error:'Too many status requests. Wait a minute before refreshing.'},429);
 const requestId=new URL(req.url).searchParams.get('requestId');
 if(requestId){try{manualClientOrderId(requestId)}catch{return json({error:'Invalid order request.'},400)}}
 const db=database();if(!db)return json({error:'Paper audit storage is not configured.'},503);
 try{
  let query=db.from('auryn_manual_paper_orders').select(auditColumns).eq('user_id',auth.user.id);
  if(requestId)query=query.eq('id',requestId.toLowerCase());
  const {data,error}=await query.order('created_at',{ascending:false}).limit(20);
  if(error)return json({error:'Manual paper history requires the current manual-paper migration.'},503);
  if(requestId&&!data?.length)return json({error:'Manual paper order not found.'},404);
  const key=process.env.ALPACA_PAPER_API_KEY,secret=process.env.ALPACA_PAPER_API_SECRET;
  if(!key||!secret)return json({items:(data||[]).map(row=>storedOrder(row,'Broker credentials are unavailable. Showing the last stored record.'))});
  if(!data?.length)return json({items:[]});
  const broker=new AlpacaPaperBroker(key,secret),items:any[]=[],signal=AbortSignal.timeout(8000);
  // Bound broker concurrency; GET only reads orders and records observations, never transmits orders or cancellations.
  for(let offset=0;offset<data.length;offset+=4){items.push(...await Promise.all(data.slice(offset,offset+4).map(row=>isManualTerminal(row.status)&&row.broker_checked_at?storedOrder(row,'Completed order; showing its last verified broker record.','stored'):signal.aborted?storedOrder(row,'The status refresh timed out. Refresh to check this order.'):reconcileOrder(db,broker,auth.user.id,row,signal))));}
  return json({items});
 }catch{return json({error:'Manual paper history is temporarily unavailable.'},503)}
}
export async function DELETE(req:Request){
 const auth=await authorizeRequest(req,true);if(auth.response)return auth.response;
 const rate=await rateLimitDistributed(`manual-paper-cancel:${auth.user.id}:${requestKey(req)}`,10,60000);if(!rate.ok)return json({error:'Too many cancellation requests. Wait a minute before trying again.'},429);
 const body=await req.json().catch(()=>null);
 if(body?.confirmed!==true)return json({error:'Review and confirm the cancellation first.'},400);
 try{manualClientOrderId(body?.requestId)}catch{return json({error:'Invalid order request.'},400)}
 const requestId=body.requestId.toLowerCase(),db=database(),key=process.env.ALPACA_PAPER_API_KEY,secret=process.env.ALPACA_PAPER_API_SECRET;
 if(!db||!key||!secret)return json({error:'Paper broker and audit storage must be configured.'},503);
 try{
  const {data:row,error}=await db.from('auryn_manual_paper_orders').select(auditColumns).eq('id',requestId).eq('user_id',auth.user.id).maybeSingle();
  if(error)return json({error:'Manual paper audit storage is unavailable.'},503);
  if(!row)return json({error:'Manual paper order not found.'},404);
  if(row.cancel_requested_at)return json({error:'A cancellation attempt is already recorded. Refresh broker status; do not resend.',reconcile:true},409);
  const broker=new AlpacaPaperBroker(key,secret),verified=await reconcileOrder(db,broker,auth.user.id,row);
  if(verified.reconciliation!=='verified')return json({error:verified.reconciliationNote,reconcile:true},409);
  if(!verified.canCancel)return json({error:'This order is no longer eligible for cancellation. Refresh to review its fills.',order:verified},409);
  // Claim once before any broker mutation. A lost response remains a recorded, non-repeatable attempt.
  const requestedAt=new Date().toISOString();
  const {data:claim,error:claimError}=await db.from('auryn_manual_paper_orders').update({cancel_requested_at:requestedAt,cancel_status:'REQUESTING'}).eq('id',requestId).eq('user_id',auth.user.id).eq('broker_checked_at',verified.broker_checked_at).is('cancel_requested_at',null).select('id').maybeSingle();
  if(claimError||!claim)return json({error:'Cancellation could not be safely recorded or another request changed this order. Refresh before continuing.',reconcile:true},409);
  try{
   await broker.cancelOrder(verified.broker_order_id);
  }catch{
   await db.from('auryn_manual_paper_orders').update({cancel_status:'UNKNOWN'}).eq('id',requestId).eq('user_id',auth.user.id);
   return json({error:'Cancellation outcome is uncertain. Refresh broker status or check Alpaca Paper. This attempt will not be resent automatically.',reconcile:true},502);
  }
  const {error:auditError}=await db.from('auryn_manual_paper_orders').update({cancel_status:'REQUESTED'}).eq('id',requestId).eq('user_id',auth.user.id);
  return json({order:{...verified,canCancel:false,cancel_requested_at:requestedAt,cancel_status:auditError?'REQUESTING':'REQUESTED'},message:'Cancellation requested. The order may still fill until Alpaca confirms it is canceled.',warning:auditError?'The request was acknowledged, but the audit update failed. Refresh broker status.':null},202);
 }catch{return json({error:'Cancellation could not be completed safely. Refresh broker status before taking another action.',reconcile:true},503)}
}
export async function POST(req:Request){
 const auth=await authorizeRequest(req,true);if(auth.response)return auth.response;
 const rate=await rateLimitDistributed(`manual-paper:${auth.user.id}:${requestKey(req)}`,10,60000);if(!rate.ok)return json({error:'Too many requests. Wait a minute before trying again.'},429);
 if(process.env.TRADING_LAB_PAPER_ENABLED!=='true')return json({error:'Paper execution is disabled in this deployment.'},409);
 const db=database(),key=process.env.ALPACA_PAPER_API_KEY,secret=process.env.ALPACA_PAPER_API_SECRET;if(!db||!key||!secret)return json({error:'Paper broker and audit storage must be configured.'},503);
 let ticket;const body=await req.json().catch(()=>null);
 try{ticket=validateManualTicket(body)}catch(e:any){return json({error:e.message},400)}
 try{
  const {data:existing,error:readError}=await db.from('auryn_manual_paper_orders').select('*').eq('id',ticket.requestId).eq('user_id',auth.user.id).maybeSingle();
  if(readError)return json({error:'Manual paper audit storage is unavailable. Apply the required migration.'},503);
  if(existing)return json({order:existing,replayed:true});
  const broker=new AlpacaPaperBroker(key,secret);
  const [account,positions,clock,configuration,quote]=await Promise.all([broker.getAccount(),broker.getPositions(),broker.getClock(),broker.getAccountConfiguration(),loadCanonicalMarketSnapshot({symbol:ticket.symbol,twelveKey:process.env.TWELVE_DATA_API_KEY,alpacaKey:key,alpacaSecret:secret})]);
  let risk;try{risk=checkManualRisk(ticket,{market:quote.snapshot,account,positions,clockOpen:clock.isOpen,configuration})}catch(e:any){return json({error:e.message},409)}
  if(body?.preview===true)return json({preview:{...ticket,...risk,userId:auth.user.id,mode:'paper',type:'limit',timeInForce:'day'}});
  if(body?.confirmed!==true)return json({error:'Review and confirm the paper order first.'},400);
  const record={id:ticket.requestId,user_id:auth.user.id,symbol:ticket.symbol,side:ticket.side,quantity:ticket.quantity,limit_price:ticket.limitPrice,status:'SUBMITTING',detail:'User-confirmed paper order; not an automated engine decision.'};
  const {error:claimError}=await db.from('auryn_manual_paper_orders').insert(record);
  if(claimError)return json({error:'The request is already recorded or audit storage is unavailable. Refresh history before retrying.',reconcile:true},409);
  try{
   const order=await broker.submitOrder({clientOrderId:manualClientOrderId(ticket.requestId),symbol:ticket.symbol,side:ticket.side,quantity:ticket.quantity,type:'limit',timeInForce:'day',limitPrice:ticket.limitPrice,referencePrice:risk.referencePrice,notional:risk.notional,version:'manual-paper-v1'});
   const {error:auditError}=await db.from('auryn_manual_paper_orders').update({status:order.status,broker_order_id:order.id,detail:'Broker response recorded. Submission does not guarantee a fill.'}).eq('id',ticket.requestId).eq('user_id',auth.user.id).eq('status','SUBMITTING');
   return json({order:{...record,status:order.status,broker_order_id:order.id},warning:auditError?'Broker accepted the order, but audit update failed. Check Alpaca Paper before placing another order.':null});
  }catch{await db.from('auryn_manual_paper_orders').update({status:'UNKNOWN',detail:'Submission outcome is uncertain. Check the Alpaca Paper account before placing another order.'}).eq('id',ticket.requestId).eq('user_id',auth.user.id).eq('status','SUBMITTING');return json({error:'Submission outcome is uncertain. Check Alpaca Paper before placing another order. Do not retry as a new order.'},502);}
 }catch{return json({error:'Paper broker or market data is unavailable. No new order was submitted.'},503);}
}
