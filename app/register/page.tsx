"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowRight,CheckCircle2,ShieldCheck,Sparkles} from "lucide-react";
import {supabaseBrowser} from "@/lib/supabase";

export default function Register(){
 const[name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[accepted,setAccepted]=useState(false),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),r=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();if(!accepted){setMsg("Please acknowledge the Terms and investment/data disclaimer.");return}setBusy(true);setMsg("");try{const {error}=await supabaseBrowser().auth.signUp({email,password,options:{data:{full_name:name}}});if(error)setMsg(error.message);else r.replace("/dashboard")}catch{setMsg("Unable to create the account right now. Please try again.")}finally{setBusy(false)}}
 return <main className="osAuth v18Auth v44Auth">
  <Link className="osLogo v37Logo v44AuthLogo" href="/"><span className="v37Wordmark">NIVORA<span>.</span></span><small>Decision Intelligence</small></Link>
  <section className="v44AuthShell">
   <aside className="v44AuthStory"><div className="v44AuthMark"><Sparkles size={18}/></div><small>BUILD YOUR NIVORA WORKSPACE</small><h2>Know what to do next. Research less. Understand more.</h2><p>Bring watchlists, positions and thesis changes into one decision-first workspace.</p><div className="v44AuthPoints"><span><CheckCircle2 size={16}/>Clear action + price plan</span><span><CheckCircle2 size={16}/>Simple, Investor and Pro depth</span><span><ShieldCheck size={16}/>Transparent model and data limitations</span></div><div className="v44AuthLegal">NIVORA does not promise profits and is not a substitute for independent verification.</div></aside>
   <form onSubmit={submit} className="v44AuthForm"><small>GET STARTED</small><h1>Create account</h1><p>Your private workspace for watchlists, positions and market decisions.</p><label>Name<input autoFocus autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required/></label><label>Email<input autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input autoComplete="new-password" minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><label className="legalCheck"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to the <Link href="/terms">Terms of Use</Link> and acknowledge that NIVORA provides decision-support research, not personalized investment advice. Market and model outputs can be delayed, incomplete or wrong. <Link href="/disclaimer">Read risk disclosure</Link>.</span></label><button disabled={busy||!accepted}>{busy?"Creating…":<>Create account <ArrowRight size={16}/></>}</button>{msg&&<div className="formError">{msg}</div>}<div className="osAuthSwitch">Already have an account? <Link href="/login">Sign in</Link></div><div className="v44AuthFine"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Risk disclosure</Link></div></form>
  </section>
 </main>;
}
