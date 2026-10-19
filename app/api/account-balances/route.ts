import { account, failure, HttpError, privateJson, limit } from '@/lib/server';
import { cleanAccountBalances } from '@/lib/account-balances';
export async function GET(request: Request) {
 try {
  const {user,db}=await account(request);
  const r=await db.from('auryn_account_balances').select('margin_debt,managed_value,updated_at').eq('user_id',user.id).maybeSingle();
  if(r.error) throw new HttpError('Account balances unavailable. Run the account-balances setup SQL.',503);
  return privateJson({balances:r.data});
 } catch(e){return failure(e);}
}
export async function POST(request: Request) {
 try {
  const {user,db}=await account(request);limit(`account-balances:${user.id}`,20);
  let balances;try{balances=cleanAccountBalances(await request.json());}catch(e){throw new HttpError(e instanceof Error?e.message:'Check balances.');}
  const r=await db.from('auryn_account_balances').upsert({user_id:user.id,...balances,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(r.error)throw new HttpError('Could not save account balances. Run the account-balances setup SQL.',503);
  return privateJson({saved:true});
 }catch(e){return failure(e);}
}
