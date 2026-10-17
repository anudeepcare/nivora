"use client";
import {useEffect} from "react";
import {supabaseBrowser} from "@/lib/supabase";
import {normalizePreferences,resolveTheme,type Preferences} from "@/lib/appearance.mjs";
export const THEMES=['light','dark','system'] as const;
export const TEXT_SIZES=['compact','standard','large'] as const;
export const DENSITIES=['comfortable','compact'] as const;
export const NUMBER_FORMATS=['standard','abbreviated'] as const;
export const MOTIONS=['standard','reduced'] as const;
export type AurynAppearance=Preferences;
const keys:Record<keyof Preferences,string>={theme:'auryn-theme',accent:'auryn-accent',density:'auryn-density',textSize:'auryn-text-size',numberFormat:'auryn-number-format',motion:'auryn-motion',chartStyle:'auryn-chart-style',primaryView:'auryn-primary-view'};
export function readAurynAppearance():Preferences{
 const raw:Partial<Preferences>={};
 try{for(const k of Object.keys(keys) as (keyof Preferences)[]) {const v=localStorage.getItem(keys[k]);if(v)raw[k]=v}}catch{}
 return normalizePreferences(raw);
}
export function applyAurynAppearance(next:Partial<Preferences>){
 const value=normalizePreferences({...readAurynAppearance(),...next});
 const before=JSON.stringify({...readAurynAppearance(),resolvedTheme:document.documentElement.dataset.theme});
 for(const k of Object.keys(keys) as (keyof Preferences)[]){document.documentElement.dataset[k]=k==='theme'?resolveTheme(value.theme,window.matchMedia('(prefers-color-scheme: dark)').matches):value[k];try{localStorage.setItem(keys[k],value[k])}catch{}}
 if(before!==JSON.stringify({...value,resolvedTheme:document.documentElement.dataset.theme}))window.dispatchEvent(new CustomEvent('auryn-appearance',{detail:value}));
}
export default function ThemeProvider({children}:{children:React.ReactNode}){
 useEffect(()=>{const sync=()=>applyAurynAppearance(readAurynAppearance());sync();const media=window.matchMedia('(prefers-color-scheme: dark)');media.addEventListener('change',sync);const storage=(event:StorageEvent)=>{if(event.key&&Object.values(keys).includes(event.key))sync();};window.addEventListener('storage',storage);return()=>{media.removeEventListener('change',sync);window.removeEventListener('storage',storage)}},[]);
 useEffect(()=>{
  let alive=true,lastAccount='';let unsubscribe=()=>{};
  const account=(user:any)=>{if(!alive)return;if(!user){lastAccount='';return;}const prefs=user.user_metadata?.auryn_appearance;if(!prefs||typeof prefs!=='object')return;const signature=user.id+JSON.stringify(prefs);if(signature===lastAccount)return;lastAccount=signature;applyAurynAppearance(normalizePreferences(prefs));};
  try{const sb=supabaseBrowser();sb.auth.getSession().then(({data})=>account(data.session?.user)).catch(()=>{});const {data}=sb.auth.onAuthStateChange((event,session)=>{if(['INITIAL_SESSION','SIGNED_IN','USER_UPDATED','SIGNED_OUT'].includes(event))account(session?.user)});unsubscribe=()=>data.subscription.unsubscribe();}catch{}
  return()=>{alive=false;unsubscribe()};
 },[]);
 return <>{children}</>;
}
