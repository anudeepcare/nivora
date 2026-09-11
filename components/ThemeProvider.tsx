"use client";
import {useEffect} from "react";

export const AURYN_THEME_KEY="auryn-theme";
export const AURYN_TEXT_KEY="auryn-text-size";
export const THEMES=["classic","midnight","slate","emerald"] as const;
export const TEXT_SIZES=["compact","standard","large"] as const;

export function applyAurynAppearance(theme:string,textSize:string){
 const safeTheme=(THEMES as readonly string[]).includes(theme)?theme:"classic";
 const safeText=(TEXT_SIZES as readonly string[]).includes(textSize)?textSize:"standard";
 document.documentElement.dataset.theme=safeTheme;
 document.documentElement.dataset.textSize=safeText;
 try{localStorage.setItem(AURYN_THEME_KEY,safeTheme);localStorage.setItem(AURYN_TEXT_KEY,safeText)}catch{}
 window.dispatchEvent(new CustomEvent("auryn-appearance",{detail:{theme:safeTheme,textSize:safeText}}));
}
export function readAurynAppearance(){
 try{return{theme:localStorage.getItem(AURYN_THEME_KEY)||"classic",textSize:localStorage.getItem(AURYN_TEXT_KEY)||"standard"}}catch{return{theme:"classic",textSize:"standard"}}
}
export default function ThemeProvider({children}:{children:React.ReactNode}){
 useEffect(()=>{
  const v=readAurynAppearance();
  document.documentElement.dataset.theme=v.theme;
  document.documentElement.dataset.textSize=v.textSize;
 },[]);
 return <>{children}</>;
}
