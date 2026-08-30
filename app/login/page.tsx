"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowRight,CheckCircle2,ShieldCheck,Sparkles} from "lucide-react";
import {supabaseBrowser} from "@/lib/supabase";

export default function Login(){
 const[email,setEmail]=useState(""),[password,setPassword]=useState(""),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),r=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setMsg("");try{const result:any=await Promise.race([supabaseBrowser().auth.signInWithPassword({email,password}),new Promise((_,reject)=>setTimeout(()=>reject(new Error("Sign in is taking too long. Check your connection and try again.")),12000))]);setBusy(false);if(result.error)setMsg(result.error.message);else{r.replace("/dashboard");r.refresh()}}catch(e:any){setBusy(false);setMsg(e?.message||"Unable to sign in right now.")}}
 return <main className="osAuth v44Auth">
  <Link className="osLogo v37Logo v44AuthLogo" href="/"><span className="v37Wordmark">NIVORA<span>.</span></span><small>Decision Intelligence</small></Link>
  <section className="v44AuthShell">
   <aside className="v44AuthStory"><div className="v44AuthMark"><Sparkles size={18}/></div><small>YOUR INVESTMENT INTELLIGENCE</small><h2>One clear decision. The evidence behind it.</h2><p>Track what matters, revisit your thesis and see what changed without rebuilding the analysis every day.</p><div className="v44AuthPoints"><span><CheckCircle2 size={16}/>Decision-first stock research</span><span><CheckCircle2 size={16}/>Portfolio and watchlist context</span><span><ShieldCheck size={16}/>Evidence, limitations and risk shown clearly</span></div><div className="v44AuthLegal">Research and decision-support only. No guaranteed outcomes.</div></aside>
   <form onSubmit={submit} className="v44AuthForm"><small>WELCOME BACK</small><h1>Sign in</h1><p>Continue to your private NIVORA workspace.</p><label>Email<input autoFocus autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input autoComplete="current-password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button disabled={busy}>{busy?"Signing in…":<>Continue <ArrowRight size={16}/></>}</button>{msg&&<div className="formError">{msg}</div>}<div className="osAuthSwitch">New to NIVORA? <Link href="/register">Create account</Link></div><div className="v44AuthFine"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Risk disclosure</Link></div></form>
  </section>
 </main>;
}
