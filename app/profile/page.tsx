"use client";
import {useEffect,useState} from "react";
import AuthGuard from "@/components/AuthGuard";import AppShell from "@/components/AppShell";
import {applyAurynAppearance,readAurynAppearance,type AurynAppearance} from "@/components/ThemeProvider";
import {supabaseBrowser} from "@/lib/supabase";
const themes=[
 {value:"classic",name:"Classic",note:"Warm ivory · ink · gold",sw:["#f7f5f0","#171613","#b27b31"]},
 {value:"noir",name:"Noir",note:"Obsidian · pearl · champagne",sw:["#0b0b0c","#f3ede1","#c6a56b"]},
 {value:"sapphire",name:"Sapphire",note:"Deep navy · pearl · blue",sw:["#0d1825","#f2f5f7","#5f8db5"]},
 {value:"racing",name:"Racing Green",note:"Deep green · parchment · brass",sw:["#0f241e","#f5f1e7","#b68b4b"]},
 {value:"bordeaux",name:"Bordeaux",note:"Wine · porcelain · brass",sw:["#4a202b","#fbf7f4","#a8793f"]},
 {value:"arctic",name:"Arctic",note:"Pearl · graphite · steel",sw:["#f1f4f6","#18232c","#758c9c"]},
 {value:"porcelain",name:"Bronze",note:"Porcelain · espresso · bronze",sw:["#faf7f1","#30261e","#a37543"]},
] as const;
const sizes=[["compact","Compact"],["standard","Standard"],["large","Large"]] as const;
const densities=[["comfortable","Comfortable"],["compact","Compact"]] as const;
const numberFormats=[["standard","Full"],["abbreviated","Compact"]] as const;
const motions=[["standard","Standard motion"],["reduced","Reduced"]] as const;
function Content(){
 const[email,setEmail]=useState(""),[name,setName]=useState(""),[msg,setMsg]=useState("");
 const[appearance,setAppearance]=useState<AurynAppearance>({theme:"classic",textSize:"standard",density:"comfortable",numberFormat:"standard",motion:"standard"});
 useEffect(()=>{setAppearance(readAurynAppearance());(async()=>{const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;setEmail(user.email||"");const{data}=await s.from("profiles").select("full_name").eq("id",user.id).maybeSingle();setName(data?.full_name||"")})()},[]);
 function set(next:Partial<AurynAppearance>){const v={...appearance,...next};setAppearance(v);applyAurynAppearance(v)}
 async function save(){const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;const{error}=await s.from("profiles").update({full_name:name,updated_at:new Date().toISOString()}).eq("id",user.id);setMsg(error?error.message:"Saved")}
 return <section className="simplePage"><div className="eyebrow">ACCOUNT</div><h1>Profile & Settings</h1>
 <div className="profileCard"><h2>Profile</h2><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input value={email} disabled/></label><button className="solidBtn" onClick={save}>Save changes</button>{msg&&<small>{msg}</small>}</div>
 <div className="profileCard aurynAppearanceStudio"><div className="eyebrow">APPEARANCE</div><h2>Appearance Studio</h2><p>Make AURYN feel like yours without changing the approved product layout.</p><div className="aurynAppearancePreview"><div className="aurynPreviewChrome"><span>AURYN</span><i/></div><div className="aurynPreviewBody"><small>LIVE PREVIEW</small><b>WAIT</b><span>Evidence first. Clear decisions.</span><div><i/><i/><i/></div></div></div><h3>Theme</h3>
 <div className="aurynAppearanceChoices">{themes.map(x=><button key={x.value} type="button" value={x.value} className={`aurynAppearanceChoice ${appearance.theme===x.value?"on":""}`} onClick={()=>set({theme:x.value})}><span className="aurynThemeName">{x.name}</span><span className="aurynThemeNote">{x.note}</span><span className="aurynThemeSwatches">{x.sw.map((c,i)=><i key={i} style={{background:c}}/>)}</span></button>)}</div>
 <h3>Text size</h3><p>Adjust supporting text without changing page structure.</p><div className="aurynTextChoices">{sizes.map(([v,l])=><button key={v} className={appearance.textSize===v?"on":""} onClick={()=>set({textSize:v})}>{l}</button>)}</div>
 <h3>Density</h3><p>Choose how tightly supporting information is presented.</p><div className="aurynTextChoices">{densities.map(([v,l])=><button key={v} className={appearance.density===v?"on":""} onClick={()=>set({density:v})}>{l}</button>)}</div>
 <h3>Number format</h3><p>Choose how large portfolio values are displayed.</p><div className="aurynTextChoices">{numberFormats.map(([v,l])=><button key={v} className={appearance.numberFormat===v?"on":""} onClick={()=>set({numberFormat:v})}>{l}</button>)}</div>
 <h3>Motion</h3><p>Reduce decorative motion while keeping market data and interactions fully functional.</p><div className="aurynTextChoices">{motions.map(([v,l])=><button key={v} className={appearance.motion===v?"on":""} onClick={()=>set({motion:v})}>{l}</button>)}</div></div></section>
}
export default function Page(){return <AuthGuard><AppShell><Content/></AppShell></AuthGuard>}
