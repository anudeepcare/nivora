"use client";
import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {supabaseBrowser} from "@/lib/supabase";

export default function Register(){
  const[name,setName]=useState("");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[accepted,setAccepted]=useState(false);
  const[msg,setMsg]=useState("");
  const[busy,setBusy]=useState(false);
  const r=useRouter();

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!accepted){setMsg("Please acknowledge the Terms and investment/data disclaimer.");return}
    setBusy(true);setMsg("");
    try{
      const {error}=await supabaseBrowser().auth.signUp({email,password,options:{data:{full_name:name}}});
      if(error)setMsg(error.message);else r.replace("/dashboard");
    }catch{setMsg("Unable to create the account right now. Please try again.")}
    finally{setBusy(false)}
  }

  return <main className="osAuth v18Auth">
    <Link className="osLogo" href="/">NIVORA<span>.</span></Link>
    <form onSubmit={submit}>
      <small>GET STARTED</small><h1>Create account</h1>
      <p>One private workspace for your watchlist, portfolio and market decisions.</p>
      <label>Name<input autoFocus autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required/></label>
      <label>Email<input autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Password<input autoComplete="new-password" minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      <label className="legalCheck"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to the <Link href="/terms">Terms of Use</Link> and acknowledge that NIVORA provides decision-support research, not personalized investment advice. Market data can be delayed, incomplete or inaccurate. <Link href="/disclaimer">Read disclaimer</Link>.</span></label>
      <button disabled={busy||!accepted}>{busy?"Creating…":"Create account"}</button>
      {msg&&<div className="formError">{msg}</div>}
      <div className="authTrust"><b>Private workspace</b><span>Watchlists and portfolio positions are tied to your account.</span></div>
      <div className="osAuthSwitch">Already have an account? <Link href="/login">Sign in</Link></div>
    </form>
  </main>;
}
