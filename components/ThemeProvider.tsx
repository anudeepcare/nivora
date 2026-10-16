"use client";
import {useEffect} from "react";
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
 for(const k of Object.keys(keys) as (keyof Preferences)[]){document.documentElement.dataset[k]=k==='theme'?resolveTheme(value.theme,window.matchMedia('(prefers-color-scheme: dark)').matches):value[k];try{localStorage.setItem(keys[k],value[k])}catch{}}
 window.dispatchEvent(new CustomEvent('auryn-appearance',{detail:value}));
}
export default function ThemeProvider({children}:{children:React.ReactNode}){
 useEffect(()=>{const sync=()=>applyAurynAppearance(readAurynAppearance());sync();const media=window.matchMedia('(prefers-color-scheme: dark)');media.addEventListener('change',sync);const storage=(event:StorageEvent)=>{if(event.key&&Object.values(keys).includes(event.key))sync();};window.addEventListener('storage',storage);return()=>{media.removeEventListener('change',sync);window.removeEventListener('storage',storage)}},[]);
 return <>{children}</>;
}
