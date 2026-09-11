"use client";
import {useEffect} from "react";
export const THEMES=["classic","noir","sapphire","racing","bordeaux","arctic","porcelain"] as const;
export const TEXT_SIZES=["compact","standard","large"] as const;
export const DENSITIES=["comfortable","compact"] as const;
export const NUMBER_FORMATS=["standard","abbreviated"] as const;
export const MOTIONS=["standard","reduced"] as const;
const K={theme:"auryn-theme",textSize:"auryn-text-size",density:"auryn-density",numberFormat:"auryn-number-format",motion:"auryn-motion"} as const;
export type AurynAppearance={theme:string;textSize:string;density:string;numberFormat:string;motion:string};
const valid=(v:string|null,a:readonly string[],fallback:string)=>v&&a.includes(v)?v:fallback;
export function readAurynAppearance():AurynAppearance{
 try{return{theme:valid(localStorage.getItem(K.theme),THEMES,"classic"),textSize:valid(localStorage.getItem(K.textSize),TEXT_SIZES,"standard"),density:valid(localStorage.getItem(K.density),DENSITIES,"comfortable"),numberFormat:valid(localStorage.getItem(K.numberFormat),NUMBER_FORMATS,"standard"),motion:valid(localStorage.getItem(K.motion),MOTIONS,"standard")}}catch{return{theme:"classic",textSize:"standard",density:"comfortable",numberFormat:"standard",motion:"standard"}}
}
export function applyAurynAppearance(next:Partial<AurynAppearance>){
 const cur=typeof window!=="undefined"?readAurynAppearance():{theme:"classic",textSize:"standard",density:"comfortable",numberFormat:"standard",motion:"standard"};
 const v={...cur,...next};
 const theme=valid(v.theme,THEMES,"classic"),textSize=valid(v.textSize,TEXT_SIZES,"standard"),density=valid(v.density,DENSITIES,"comfortable"),numberFormat=valid(v.numberFormat,NUMBER_FORMATS,"standard"),motion=valid(v.motion,MOTIONS,"standard");
 document.documentElement.dataset.theme=theme;document.documentElement.dataset.textSize=textSize;document.documentElement.dataset.density=density;document.documentElement.dataset.numberFormat=numberFormat;document.documentElement.dataset.motion=motion;
 try{localStorage.setItem(K.theme,theme);localStorage.setItem(K.textSize,textSize);localStorage.setItem(K.density,density);localStorage.setItem(K.numberFormat,numberFormat);localStorage.setItem(K.motion,motion)}catch{}
 window.dispatchEvent(new CustomEvent("auryn-appearance",{detail:{theme,textSize,density,numberFormat,motion}}));
}
export default function ThemeProvider({children}:{children:React.ReactNode}){useEffect(()=>applyAurynAppearance(readAurynAppearance()),[]);return <>{children}</>}
