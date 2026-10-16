"use client";
import {useCallback,useEffect,useState} from 'react';
import {supabaseBrowser} from '@/lib/supabase';

const when=(value?:string)=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString():'Not verified';
const price=(value:unknown)=>value!=null&&Number.isFinite(Number(value))?`$${Number(value).toFixed(2)}`:'Not verified';

export default function ManualPaperTicket({connected,onSubmitted}:{connected:boolean;onSubmitted:()=>void}){
 const [symbol,setSymbol]=useState(''),[side,setSide]=useState('BUY'),[quantity,setQuantity]=useState(''),[limit,setLimit]=useState('');
 const [preview,setPreview]=useState<any>(null),[items,setItems]=useState<any[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [historyError,setHistoryError]=useState(''),[uncertain,setUncertain]=useState(false),[historyBusy,setHistoryBusy]=useState(false),[cancelReview,setCancelReview]=useState<any>(null);
 const request=async(method='GET',body?:any,requestId?:string)=>{
  const {data:{session}}=await supabaseBrowser().auth.getSession();if(!session)throw Error('Please sign in again.');
  const url='/api/trading-lab/manual'+(requestId?`?requestId=${encodeURIComponent(requestId)}`:'');
  const response=await fetch(url,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'Paper request failed.'),{ambiguous:result.reconcile===true||response.status>=500});return result;
 };
 const load=useCallback(async()=>{
  setHistoryBusy(true);
  try{const result=await request();setItems(result.items||[]);setHistoryError('')}catch(e:any){setHistoryError(e.message)}finally{setHistoryBusy(false)}
 },[]);
 useEffect(()=>{
  supabaseBrowser().auth.getSession().then(({data})=>{try{const raw=localStorage.getItem('auryn-pending-paper-request:'+data.session?.user.id);const pending=raw?JSON.parse(raw):null;if(pending&&pending.userId===data.session?.user.id){setPreview(pending);setUncertain(true);setError('A previous request needs reconciliation. Check its broker status before placing another order.')}}catch{}});
  load();
 },[load]);
 async function review(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');setNotice('');try{const result=await request('POST',{symbol,side,quantity:Number(quantity),limitPrice:Number(limit),requestId:crypto.randomUUID(),preview:true});setPreview(result.preview)}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function submit(){
  if(!preview||busy)return;setBusy(true);setError('');
  try{
   localStorage.setItem('auryn-pending-paper-request:'+preview.userId,JSON.stringify(preview));
   const result=await request('POST',{...preview,confirmed:true});
   if(['UNKNOWN','SUBMITTING'].includes(result.order?.status)||result.warning){setUncertain(true);setError(result.warning||'Order outcome remains uncertain. Reconcile broker status before placing any new order.');await load();return;}
   setNotice(`Paper order recorded: ${result.order.status}. A submitted order is not necessarily filled.`);setPreview(null);setUncertain(false);localStorage.removeItem('auryn-pending-paper-request:'+preview.userId);await load();onSubmitted();
  }catch(e:any){
   if(e.ambiguous===false){setError(e.message);setPreview(null);localStorage.removeItem('auryn-pending-paper-request:'+preview.userId);return;}
   setUncertain(true);setError(`${e.message} The order outcome may be unknown. Keep this request and reconcile it before placing a new order.`);await load();
  }finally{setBusy(false)}
 }
 async function reconcile(){
  if(!preview||busy)return;setBusy(true);
  try{
   const result=await request('GET',undefined,preview.requestId);const row=(result.items||[]).find((item:any)=>item.id===preview.requestId);
   if(row)setItems(previous=>[row,...previous.filter(item=>item.id!==row.id)]);
   if(row&&['verified','stored'].includes(row.reconciliation)&&!['UNKNOWN','SUBMITTING'].includes(row.status)){
    setNotice(`Verified paper status: ${row.status}. ${row.filled_quantity??0} of ${row.quantity} shares filled.`);setPreview(null);setUncertain(false);setError('');localStorage.removeItem('auryn-pending-paper-request:'+preview.userId);
   }else setError(row?.reconciliationNote||'No conclusive broker outcome is available. Check Alpaca Paper. Do not place a replacement order.');
  }catch(e:any){setError(e.message)}finally{setBusy(false)}
 }
 async function cancel(){
  if(!cancelReview||busy)return;setBusy(true);setError('');setNotice('');
  try{const result=await request('DELETE',{requestId:cancelReview.id,confirmed:true});setNotice(result.warning||result.message);setCancelReview(null);await load();onSubmitted()}
  catch(e:any){setError(e.message);setCancelReview(null);await load()}
  finally{setBusy(false)}
 }
 return <div className="secondarySplit">
  <section className="secondaryCard">
   <h2>Paper order</h2><p>Alpaca simulated funds · US stocks · limit orders only.</p>
   {error&&<p role="alert" className="secondaryNotice">{error}</p>}{notice&&<p role="status" className="secondaryNotice">{notice}</p>}
   {preview?<section className="paperReview" aria-label="Review paper order">
    <h3>Review your paper order</h3><dl className="secondaryFacts">{[['Symbol',preview.symbol],['Side',preview.side],['Quantity',preview.quantity],['Limit price',price(preview.limitPrice)],['Maximum order value',price(preview.notional)],['Time in force','Day'],['Quote as of',when(preview.quoteAsOf)]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p>Confirming submits to the deployment’s shared Alpaca Paper account. It does not use real money. Prices and safety checks are verified again on submission.</p>
    <button className="secondaryPrimary" disabled={busy||uncertain} onClick={submit}>{busy?'Working…':'Confirm paper order'}</button>
    {uncertain?<button disabled={busy} onClick={reconcile}>Reconcile order status</button>:<button disabled={busy} onClick={()=>{setPreview(null);localStorage.removeItem('auryn-pending-paper-request:'+preview.userId)}}>Back to order</button>}
   </section>:<form className="aurynForm" onSubmit={review}>
    <label className="aurynField">Symbol<input required maxLength={10} placeholder="IREN" value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())}/></label>
    <label className="aurynField">Side<select value={side} onChange={e=>setSide(e.target.value)}><option value="BUY">Buy</option><option value="SELL">Sell</option></select></label>
    <label className="aurynField">Quantity<input required type="number" min="1" max="10000" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></label>
    <label className="aurynField">Limit price ($)<input required type="number" min="0.01" step="0.01" value={limit} onChange={e=>setLimit(e.target.value)}/></label>
    <p className="secondaryCaption">Day order · regular session only. Requires broker-enforced no-short and 1× margin settings. Buys are cash funded and limited to 10% of account equity. Sells cannot exceed owned shares. Limit price must be within 2% of the verified quote.</p>
    <button className="secondaryPrimary" disabled={busy||!connected}>{busy?'Verifying order…':'Review paper order'}</button>
    {!connected&&<p className="secondaryCaption">Connect the configured Alpaca Paper account to review an order.</p>}
   </form>}
  </section>
  <section className="secondaryCard">
   <div className="secondaryRow"><h2>Your recent manual orders</h2><button disabled={historyBusy||busy} onClick={load}>{historyBusy?'Checking broker…':'Refresh broker status'}</button></div>
   {historyError&&<p role="alert" className="secondaryNotice">{historyError}</p>}
   {cancelReview&&<section className="paperReview" aria-label="Review cancellation">
    <h3>Cancel the remaining paper order?</h3>
    <dl className="secondaryFacts"><div><dt>Order</dt><dd>{cancelReview.side} {cancelReview.quantity} {cancelReview.symbol} at {price(cancelReview.limit_price)}</dd></div><div><dt>Shares already filled</dt><dd>{cancelReview.filled_quantity??'Not verified'}</dd></div><div><dt>Shares remaining</dt><dd>{cancelReview.quantity-(cancelReview.filled_quantity??0)}</dd></div><div><dt>Broker status checked</dt><dd>{when(cancelReview.broker_checked_at)}</dd></div></dl>
    <p>This requests cancellation of the unfilled shares. Cancellation does not reverse completed fills, and the order may still fill before the broker confirms cancellation.</p>
    <button className="secondaryPrimary" disabled={busy} onClick={cancel}>{busy?'Requesting cancellation…':'Confirm cancellation'}</button><button disabled={busy} onClick={()=>setCancelReview(null)}>Keep order</button>
   </section>}
   {items.length?<div className="secondaryTableWrap"><table className="secondaryTable">
    <thead><tr><th>Symbol</th><th>Side / quantity</th><th>Status / fills</th></tr></thead>
    <tbody>{items.map(item=><tr key={item.id}>
     <td>{item.symbol}<small>{when(item.created_at)}</small></td>
     <td>{item.side} {item.quantity}<small>Limit {price(item.limit_price)}</small></td>
     <td><details><summary>{String(item.status).replaceAll('_',' ')}</summary><p>{item.detail}</p><p>{item.reconciliationNote}</p><small>{item.broker_order_id||'Broker order ID not recorded'}</small>{item.cancel_requested_at&&<p>Cancellation attempt: {when(item.cancel_requested_at)} · {item.cancel_status==='REQUESTED'?'Request acknowledged; check broker status for its outcome.':'Outcome needs reconciliation; this attempt will not be resent.'}</p>}</details>
      <small>Last verified: {when(item.broker_checked_at)}</small>{!['verified','stored'].includes(item.reconciliation)&&<p className="secondaryCaption">{item.reconciliationNote}</p>}
      <small>{item.filled_quantity==null?'Filled quantity not verified':`${item.filled_quantity} / ${item.quantity} filled`}</small>{Number(item.filled_quantity)>0&&<small>Average fill {price(item.filled_avg_price)}</small>}
      {item.canCancel===true&&<button disabled={busy||historyBusy} onClick={()=>{setCancelReview(item);setError('');setNotice('')}}>Review cancellation</button>}
     </td>
    </tr>)}</tbody>
   </table></div>:!historyError&&<div className="secondaryEmpty">{historyBusy?'Checking your recorded orders…':'No manual paper orders recorded.'}</div>}
   <p className="secondaryCaption">Refresh reads broker status for your recorded manual orders. A cancellation request is complete only when the broker reports canceled; any completed fills remain. Manual orders are separate from automated strategy evaluations.</p>
  </section>
 </div>;
}
