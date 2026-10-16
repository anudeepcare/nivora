"use client";
import {useEffect,useRef,useState,useCallback} from 'react';
import {supabaseBrowser} from '@/lib/supabase';
import {validateContribution,type ContributionSettings} from '@/lib/auryn/workspace/model';
export function useContributionSettings(symbol:string){
 const [settings,setSettings]=useState<ContributionSettings|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[owner,setOwner]=useState<string|null>(null),[loadedSymbol,setLoadedSymbol]=useState('');
 const generation=useRef(0),ownerRef=useRef<string|null>(null);
 useEffect(()=>{let active=true;const client=supabaseBrowser();
  const load=async()=>{const ticket=++generation.current;setLoading(true);setError('');try{const {data,error}=await client.auth.getSession();if(!active||ticket!==generation.current)return;const session=data.session;ownerRef.current=session?.user.id??null;setOwner(ownerRef.current);if(error||!session){setSettings(null);return;}
   const response=await fetch(`/api/research-workspace?scope=contribution&symbol=${encodeURIComponent(symbol)}`,{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});const value=await response.json();if(!active||ticket!==generation.current)return;if(!response.ok)throw Error(value.error||'Contribution settings could not be loaded.');setSettings(value.settings?validateContribution(value.settings):null);setLoadedSymbol(symbol);
  }catch(e){if(active&&ticket===generation.current){setSettings(null);setError(e instanceof Error?e.message:'Contribution settings unavailable.');}}finally{if(active&&ticket===generation.current)setLoading(false);}};
  void load();const sub=client.auth.onAuthStateChange((_event,session)=>{if(ownerRef.current!==(session?.user.id??null)){generation.current++;ownerRef.current=session?.user.id??null;setOwner(ownerRef.current);setSettings(null);setLoading(true);setTimeout(()=>{if(active)void load()},0);}});
  const reload=()=>void load();window.addEventListener('auryn-contribution-saved',reload);return()=>{active=false;generation.current++;sub.data.subscription.unsubscribe();window.removeEventListener('auryn-contribution-saved',reload)};
 },[symbol]);
 const save=useCallback(async(draft:ContributionSettings)=>{const ticket=generation.current,expectedOwner=ownerRef.current,clean=validateContribution(draft);const {data,error}=await supabaseBrowser().auth.getSession();if(error||!data.session||!expectedOwner||data.session.user.id!==expectedOwner)throw Error('Sign in again before saving your contribution.');const response=await fetch('/api/research-workspace',{method:'POST',headers:{Authorization:`Bearer ${data.session.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({op:'contribution',symbol,settings:clean})});const value=await response.json();if(ticket!==generation.current||ownerRef.current!==expectedOwner)throw Error('Account changed. Reopen your contribution settings.');if(!response.ok)throw Error(value.error||'Contribution could not be saved.');setSettings(clean);window.dispatchEvent(new Event('auryn-contribution-saved'));},[symbol]);
 return {settings:loadedSymbol===symbol?settings:null,loading,error,owner,save};
}
