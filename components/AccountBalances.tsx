'use client';
import {useEffect,useState} from 'react';
import {useProduct,useResource} from './Session';
import {api} from '@/lib/client';
import {amount,quoteTime} from '@/lib/format';
import {accountEquity,type AccountBalances as Balances} from '@/lib/account-balances';
const preview={balances:null};
export default function AccountBalances({assets,ready,missing}:{assets:number;ready:boolean;missing:number}){
 const {demo}=useProduct();
 const records=useResource<{balances:Balances|null}>('account-balances',demo?preview:undefined);
 const b=records.data?.balances;
 const [editing,setEditing]=useState(false),[debt,setDebt]=useState(''),[managed,setManaged]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[confirmed,setConfirmed]=useState(false);
 useEffect(()=>{setDebt(b?String(b.margin_debt):'');setManaged(b?.managed_value==null?'':String(b.managed_value));setConfirmed(b?.managed_value!=null);},[b]);
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setMessage('');try{
  if(demo)throw Error('Sign in to save balances.');
  if(managed.trim()&&!confirmed)throw Error('Confirm that managed investments are separate from listed holdings.');
  await api('account-balances',{margin_debt:debt.trim()?Number(debt):0,managed_value:managed.trim()?Number(managed):null});
  setEditing(false);records.refresh();
 }catch(e){setMessage(e instanceof Error?e.message:'Could not save.');}finally{setBusy(false);}}
 return <div className="account-equity">
  <span className="eyebrow">{b?'Net equity · USD':'Priced assets & cash · USD'}</span>
  <div className="balance">{ready?amount(b?accountEquity(assets,b):assets):'—'}</div>
  {b&&<dl className="account-equity-breakdown"><div><dt>Listed assets & cash</dt><dd>{ready?amount(assets):'—'}</dd></div><div><dt>Managed investments</dt><dd>{b.managed_value==null?'Not entered':amount(b.managed_value)}</dd></div><div><dt>Margin debt</dt><dd>−{amount(b.margin_debt)}</dd></div></dl>}
  {b&&(missing>0||b.managed_value==null)&&<p className="balance-caption">Partial equity: {missing>0?`${missing} unpriced holdings excluded. `:''}{b.managed_value==null?'Managed portfolio not included until its exact value is entered.':''}</p>}
  {b?.updated_at&&<small className="account-balance-date">Balances recorded {quoteTime(b.updated_at)} · manual values</small>}
  {records.error&&<p className="balance-caption">Margin and managed balances unavailable; shown total is gross listed assets.</p>}
  <button type="button" className="text-button account-balance-edit" onClick={()=>setEditing(!editing)}>{editing?'Close balance editor':'Edit margin & managed balance'}</button>
  {editing&&<form onSubmit={save} className="account-balance-form"><label>Margin debt · USD<input type="number" min="0" max="1000000000000" step="0.01" value={debt} onChange={e=>setDebt(e.target.value)} placeholder="0" /></label><label>Separate managed investments · USD<input type="number" min="0" max="1000000000000" step="0.01" value={managed} onChange={e=>{setManaged(e.target.value);setConfirmed(false);}} placeholder="Exact current value" /></label><label className="account-balance-confirm"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} />Managed value excludes all holdings already listed below.</label><button className="primary-button" disabled={busy||!!demo}>{busy?'Saving…':'Save balances'}</button>{message&&<p role="alert">{message}</p>}</form>}
 </div>;
}
