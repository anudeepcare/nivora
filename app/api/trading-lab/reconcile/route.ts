import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {authorizeRequest} from '@/lib/server/authorization';
import {AlpacaPaperBroker} from '@/lib/alpaca-paper';
import {withPaperLease,reconcilePaperOrders} from '@/lib/server/paper-operations';
export const dynamic='force-dynamic';
export const maxDuration=60;
/** This operation observes broker orders and records their state, including while paused. */
export async function POST(req:Request){
 const auth=await authorizeRequest(req,true);if(auth.response)return auth.response;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY,brokerKey=process.env.ALPACA_PAPER_API_KEY,brokerSecret=process.env.ALPACA_PAPER_API_SECRET;
 if(!url||!key||!brokerKey||!brokerSecret)return NextResponse.json({error:'Paper audit and broker configuration are required.'},{status:503});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),broker=new AlpacaPaperBroker(brokerKey,brokerSecret);
 try{
  await withPaperLease(db,crypto.randomUUID(),()=>reconcilePaperOrders(db,broker),true);
  return NextResponse.json({status:'ok',mode:'paper',message:'Automated paper order statuses reconciled. No new orders or cancellations were submitted.'},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e:any){return NextResponse.json({status:'unavailable',code:e?.message||'PAPER_RECONCILIATION_UNAVAILABLE',error:'Reconciliation could not finish. Review the recorded orders; no new order was submitted.'},{status:409});}
}
