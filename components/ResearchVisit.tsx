"use client";
import {useEffect} from 'react';
import {supabaseBrowser} from '@/lib/supabase';
import {mergeRecentResearch,recentResearchKey,validResearchSymbol} from '@/lib/research-discovery';
export default function ResearchVisit({symbol,name}:{symbol:string;name:string}) {
 useEffect(()=>{let active=true;if(!validResearchSymbol(symbol)||!name)return;
   supabaseBrowser().auth.getUser().then(({data,error})=>{if(!active||error||!data.user)return;
     try{const key=recentResearchKey(data.user.id);let previous:unknown=[];try{previous=JSON.parse(localStorage.getItem(key)||'[]');}catch{}
       localStorage.setItem(key,JSON.stringify(mergeRecentResearch(previous,{symbol,name,visitedAt:new Date().toISOString()})));
     }catch{/* Research remains usable when storage is disabled. */}
   }).catch(()=>{});return()=>{active=false;};
 },[symbol,name]);return null;
}
