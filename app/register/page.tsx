"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowRight} from "lucide-react";
import {supabaseBrowser} from "@/lib/supabase";
import AuthShell from "@/components/auth/AuthShell";
export default function Register(){
 const[name,setName]=useState(""),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[accepted,setAccepted]=useState(false),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),r=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();if(!accepted){setMsg("Please acknowledge the Terms and investment/data disclaimer.");return}setBusy(true);setMsg("");try{const {error}=await supabaseBrowser().auth.signUp({email,password,options:{data:{full_name:name}}});if(error)setMsg(error.message);else r.replace("/dashboard")}catch{setMsg("Unable to create the account right now. Please try again.")}finally{setBusy(false)}}
 return <AuthShell eyebrow="Get started" title="Create account" subtitle="Build a private workspace for research, positions and market decisions." storyTitle="Know what to do next. See exactly why." storyBody="Research less noise. Understand the evidence, the action, the price plan and what could make the thesis wrong." points={["Clear action and price plan","Simple, Investor and Pro depth","Transparent model and data limitations"]}>
  <form className="aurynForm" onSubmit={submit}>
   <label className="aurynField">Name<input autoFocus autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required/></label>
   <label className="aurynField">Email<input autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label className="aurynField">Password<input autoComplete="new-password" minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
   <label className="aurynLegalCheck"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to the <Link href="/terms">Terms of Use</Link> and acknowledge that AURYN provides decision-support research, not personalized investment advice. <Link href="/disclaimer">Read risk disclosure.</Link></span></label>
   <button className="aurynPrimary" disabled={busy||!accepted}>{busy?"Creating…":<>Create account <ArrowRight size={16}/></>}</button>
   {msg&&<div className="formError">{msg}</div>}
   <div className="aurynAuthSwitch">Already have an account? <Link href="/login">Sign in</Link></div>
   <div className="aurynFine"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/disclaimer">Risk disclosure</Link></div>
  </form>
 </AuthShell>
}