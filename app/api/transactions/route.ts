import { account, failure, HttpError, privateJson, limit } from '@/lib/server';
import { cleanTransactions } from '@/lib/transaction-ledger';
export async function GET(request:Request){try{const {user,db}=await account(request);const r=await db.from('auryn_transaction_ledgers').select('rows,revision,updated_at').eq('user_id',user.id).maybeSingle();if(r.error)throw new HttpError('Transaction storage unavailable. Apply the transaction-ledger migration.',503);if(r.data){try{r.data.rows=cleanTransactions(r.data.rows);}catch{throw new HttpError('Saved transactions need repair before they can be displayed.',422);}}return privateJson(r.data??{rows:[],revision:0,updated_at:null});}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const {user,db}=await account(request);limit(`transactions:${user.id}`,10);
 if(Number(request.headers.get('content-length')??0)>2000000)throw new HttpError('Ledger too large.',413);
 const raw=await request.text();if(raw.length>2000000)throw new HttpError('Ledger too large.',413);
 let body,rows;try{body=JSON.parse(raw);rows=cleanTransactions(body.rows);}catch(e){throw new HttpError(e instanceof Error?e.message:'Check transactions.',400);}
 if(!Number.isSafeInteger(body.revision)||body.revision<0)throw new HttpError('Reload the saved ledger.',400);
 const data={user_id:user.id,rows,revision:body.revision+1,updated_at:new Date().toISOString()};
 const result=body.revision===0?await db.from('auryn_transaction_ledgers').insert(data).select('revision').single():await db.from('auryn_transaction_ledgers').update(data).eq('user_id',user.id).eq('revision',body.revision).select('revision').maybeSingle();
 if(result.error?.code==='23505'||(!result.error&&!result.data))throw new HttpError('Your ledger changed in another tab. Reload it before saving.',409);
 if(result.error)throw new HttpError('Transactions could not be saved.',503);
 return privateJson({saved:true,revision:data.revision});
 }catch(e){return failure(e);}}
