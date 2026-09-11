"use client";
import {useEffect,useState} from "react";
import AuthGuard from "@/components/AuthGuard";import AppShell from "@/components/AppShell";
import {applyAurynAppearance,readAurynAppearance,type AurynAppearance} from "@/components/ThemeProvider";
import {supabaseBrowser} from "@/lib/supabase";
const themes=[
 {value:"classic",name:"AURYN Classic",note:"Ivory · ink · heritage gold",sw:["#f7f5f0","#171613","#b27b31"]},
 {value:"noir",name:"Noir Champagne",note:"Obsidian · pearl · champagne",sw:["#0b0b0c","#f3ede1","#c6a56b"]},
 {value:"sapphire",name:"Midnight Sapphire",note:"Midnight navy · pearl · sapphire",sw:["#0b1320","#eef3f7","#3f719b"]},
 {value:"racing",name:"British Racing Green",note:"Deep racing green · parchment · brass",sw:["#0c211b","#f4f0e5","#b08a4d"]},
 {value:"bordeaux",name:"Bordeaux Reserve",note:"Wine · porcelain · antique brass",sw:["#451d28","#f8f3f1","#a67c42"]},
 {value:"arctic",name:"Arctic Graphite",note:"Cool pearl · graphite · steel",sw:["#f1f4f6","#17212a","#6f8797"]},
 {value:"porcelain",name:"Porcelain Bronze",note:"Porcelain · espresso · bronze",sw:["#faf7f1","#30261e","#9b7040"]},
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
