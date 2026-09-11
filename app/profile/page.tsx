"use client";
import {useEffect,useState} from "react";
import AuthGuard from "@/components/AuthGuard";import AppShell from "@/components/AppShell";
import {applyAurynAppearance,readAurynAppearance,type AurynAppearance} from "@/components/ThemeProvider";
import {supabaseBrowser} from "@/lib/supabase";
const themes=[
 {value:"classic",name:"Auryn Classic",note:"Warm ivory · black · antique gold",sw:["#f7f5f0","#15130f","#b27b31"]},
 {value:"midnight",name:"Midnight",note:"Deep charcoal · ivory · warm gold",sw:["#0e1013","#16191e","#d3a45c"]},
 {value:"slate",name:"Slate",note:"Cool light · graphite · restrained bronze",sw:["#eef1f4","#18212a","#7f694a"]},
 {value:"emerald",name:"Emerald",note:"Warm light · forest · heritage gold",sw:["#f1f4ef","#102019","#8c6a32"]},
 {value:"obsidian",name:"Obsidian Gold",note:"Black · warm graphite · luminous gold",sw:["#090a0b","#1a1a18","#d5a552"]},
 {value:"ocean",name:"Ocean",note:"Pearl · navy · mineral blue",sw:["#f3f7f8","#102a3c","#397d9d"]},
 {value:"burgundy",name:"Burgundy",note:"Porcelain · wine · muted brass",sw:["#f8f3f1","#451d28","#a67c42"]},
] as const;
const sizes=[["compact","Compact"],["standard","Standard"],["large","Large"]] as const;
const densities=[["comfortable","Comfortable"],["compact","Compact"]] as const;
const numberFormats=[["standard","$1,240,500"],["abbreviated","$1.24M"]] as const;
function Content(){
 const[email,setEmail]=useState(""),[name,setName]=useState(""),[msg,setMsg]=useState("");
 const[appearance,setAppearance]=useState<AurynAppearance>({theme:"classic",textSize:"standard",density:"comfortable",numberFormat:"standard"});
 useEffect(()=>{setAppearance(readAurynAppearance());(async()=>{const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;setEmail(user.email||"");const{data}=await s.from("profiles").select("full_name").eq("id",user.id).maybeSingle();setName(data?.full_name||"")})()},[]);
 function set(next:Partial<AurynAppearance>){const v={...appearance,...next};setAppearance(v);applyAurynAppearance(v)}
 async function save(){const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;const{error}=await s.from("profiles").update({full_name:name,updated_at:new Date().toISOString()}).eq("id",user.id);setMsg(error?error.message:"Saved")}
 return <section className="simplePage"><div className="eyebrow">ACCOUNT</div><h1>Profile & Settings</h1>
 <div className="profileCard"><h2>Profile</h2><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input value={email} disabled/></label><button className="solidBtn" onClick={save}>Save changes</button>{msg&&<small>{msg}</small>}</div>
 <div className="profileCard"><div className="eyebrow">APPEARANCE</div><h2>Theme</h2><p>Personalize AURYN's colors. The approved layout stays locked.</p>
 <div className="aurynAppearanceChoices">{themes.map(x=><button key={x.value} type="button" value={x.value} className={`aurynAppearanceChoice ${appearance.theme===x.value?"on":""}`} onClick={()=>set({theme:x.value})}><span className="aurynThemeName">{x.name}</span><span className="aurynThemeNote">{x.note}</span><span className="aurynThemeSwatches">{x.sw.map((c,i)=><i key={i} style={{background:c}}/>)}</span></button>)}</div>
 <h2>Text size</h2><p>Adjust supporting text without changing page structure.</p><div className="aurynTextChoices">{sizes.map(([v,l])=><button key={v} className={appearance.textSize===v?"on":""} onClick={()=>set({textSize:v})}>{l}</button>)}</div>
 <h2>Density</h2><p>Choose how tightly supporting information is presented.</p><div className="aurynTextChoices">{densities.map(([v,l])=><button key={v} className={appearance.density===v?"on":""} onClick={()=>set({density:v})}>{l}</button>)}</div>
 <h2>Number format</h2><p>Choose how large portfolio values are displayed.</p><div className="aurynTextChoices">{numberFormats.map(([v,l])=><button key={v} className={appearance.numberFormat===v?"on":""} onClick={()=>set({numberFormat:v})}>{l}</button>)}</div>
 </div></section>
}
export default function Page(){return <AuthGuard><AppShell><Content/></AppShell></AuthGuard>}
