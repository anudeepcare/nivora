"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowRight} from "lucide-react";
import {supabaseBrowser} from "@/lib/supabase";
import AuthShell from "@/components/auth/AuthShell";
export default function Login(){
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),r=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");try{const result:any=await Promise.race([supabaseBrowser().auth.signInWithPassword({email,password}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("Sign in is taking too long. Check your connection and try again.")),12000))]);setBusy(false);if(result.error)setMsg(result.error.message);else{r.replace("/dashboard");r.refresh()}}catch(e:any){setBusy(false);setMsg(e?.message||"Unable to sign in right now.")}}
 return <AuthShell eyebrow="Welcome back" title="Sign in" subtitle="Continue to your private AURYN workspace." storyTitle="Know what to do next. See exactly why." storyBody="AURYN turns company quality, valuation, price behavior, catalysts and risk into one explainable investment decision." points={["Decision-first stock research","Portfolio and watchlist context","Evidence, limitations and risk shown clearly"]}>
  <form className="aurynForm" onSubmit={submit}>
   <label className="aurynField">Email<input autoFocus autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label className="aurynField">Password<input autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
   <button className="aurynPrimary" disabled={busy}>{busy?"Signing in…":<>Continue <ArrowRight size={16}/></>}</button>
   {msg&&<div className="formError">{msg}</div>}
   <div className="aurynAuthSwitch">New to AURYN? <Link href="/register">Create account</Link></div>
   <div className="aurynFine"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Risk disclosure</Link></div>
  </form>
 </AuthShell>
}