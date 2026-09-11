"use client";
import {useEffect,useState} from "react";
import AuthGuard from "@/components/AuthGuard";
import AppShell from "@/components/AppShell";
import {applyAurynAppearance,readAurynAppearance} from "@/components/ThemeProvider";
import {supabaseBrowser} from "@/lib/supabase";

const themes=[
 {value:"classic",name:"Auryn Classic",note:"Warm ivory · black · antique gold",sw:["#f7f5f0","#15130f","#b27b31"]},
 {value:"midnight",name:"Midnight",note:"Deep charcoal · ivory · warm gold",sw:["#0e1013","#16191e","#d3a45c"]},
 {value:"slate",name:"Slate",note:"Cool light · graphite · restrained bronze",sw:["#eef1f4","#18212a","#7f694a"]},
 {value:"emerald",name:"Emerald",note:"Warm light · forest · heritage gold",sw:["#f1f4ef","#102019","#8c6a32"]},
] as const;
const sizes=[["compact","Compact"],["standard","Standard"],["large","Large"]] as const;

function Content(){
 const[email,setEmail]=useState(""),[name,setName]=useState(""),[msg,setMsg]=useState("");
 const[theme,setTheme]=useState("classic"),[textSize,setTextSize]=useState("standard");
 useEffect(()=>{const a=readAurynAppearance();setTheme(a.theme);setTextSize(a.textSize);(async()=>{const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;setEmail(user.email||"");const{data}=await s.from("profiles").select("full_name").eq("id",user.id).maybeSingle();setName(data?.full_name||"")})()},[]);
 function appearance(nextTheme=theme,nextSize=textSize){setTheme(nextTheme);setTextSize(nextSize);applyAurynAppearance(nextTheme,nextSize)}
 async function save(){const s=supabaseBrowser();const{data:{user}}=await s.auth.getUser();if(!user)return;const{error}=await s.from("profiles").update({full_name:name,updated_at:new Date().toISOString()}).eq("id",user.id);setMsg(error?error.message:"Saved")}
 return <section className="simplePage"><div className="eyebrow">ACCOUNT</div><h1>Profile & Settings</h1>
  <div className="profileCard"><h2>Profile</h2><label>Name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input value={email} disabled/></label><button className="solidBtn" onClick={save}>Save changes</button>{msg&&<small>{msg}</small>}</div>
  <div className="profileCard"><div className="eyebrow">APPEARANCE</div><h2>Theme</h2><p>Change AURYN's colors without changing the layout.</p>
   <div className="aurynAppearanceChoices">{themes.map(x=><button key={x.value} type="button" value={x.value} className={`aurynAppearanceChoice ${theme===x.value?"on":""}`} onClick={()=>appearance(x.value,textSize)}><b>{x.name}</b><small>{x.note}</small><span className="aurynThemeSwatches">{x.sw.map((c,i)=><i key={i} style={{background:c}}/>)}</span></button>)}</div>
   <h2>Text size</h2><p>Only secondary labels and supporting text change. Layout stays locked.</p>
   <div className="aurynTextChoices">{sizes.map(([value,label])=><button key={value} type="button" value={value} className={textSize===value?"on":""} onClick={()=>appearance(theme,value)}>{label}</button>)}</div>
  </div>
 </section>
}
export default function Page(){return <AuthGuard><AppShell><Content/></AppShell></AuthGuard>}
