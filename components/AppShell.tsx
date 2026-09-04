"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {supabaseBrowser} from "@/lib/supabase";
import {useEffect,useRef,useState} from "react";
import {Search,BriefcaseBusiness,UserRound,Bell,Info,ShieldCheck,Star,FlaskConical,BarChart3} from "lucide-react";

export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter(),[open,setOpen]=useState(false),[email,setEmail]=useState(""),ref=useRef<HTMLDivElement>(null);
 const sb=supabaseBrowser();
 useEffect(()=>{sb.auth.getSession().then(({data})=>setEmail(data.session?.user.email||""));const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
 async function logout(){await sb.auth.signOut();router.replace("/login");router.refresh()}
 const active=(p:string)=>path===p||path.startsWith(p+"/");
 return <>
  <header className="v65Header">
   <Link className="v65Logo" href="/analyze"><span className="v65Wordmark">NIVORA<span>.</span></span><small>Decision Intelligence</small></Link>
   <nav className="v65DesktopNav" aria-label="Primary">
    <Link className={active("/analyze")||active("/stock")?"on":""} href="/analyze">Analyze</Link>
    <Link className={active("/portfolio")?"on":""} href="/portfolio">Portfolio</Link>
    <Link className={active("/trading-lab")?"on":""} href="/trading-lab">Trading Lab</Link>
   </nav>
   <div className="v65Account" ref={ref}><button onClick={()=>setOpen(!open)} aria-label="Account">{(email?.[0]||"N").toUpperCase()}</button>{open&&<div className="v65AccountMenu"><small>{email}</small><Link href="/profile"><UserRound size={14}/>Account</Link><Link href="/alerts"><Bell size={14}/>Alerts</Link><Link href="/watchlist"><Star size={14}/>Watchlist</Link><Link href="/calibration"><BarChart3 size={14}/>Calibration</Link><Link href="/about"><Info size={14}/>Why NIVORA</Link><Link href="/terms"><ShieldCheck size={14}/>Legal & privacy</Link><button onClick={logout}>Log out</button></div>}</div>
  </header>
  <main className="v65Main">{children}</main>
  <nav className="v65MobileNav" aria-label="Mobile navigation">
   <Link className={active("/analyze")||active("/stock")?"on":""} href="/analyze"><Search size={19}/><span>Analyze</span></Link>
   <Link className={active("/portfolio")?"on":""} href="/portfolio"><BriefcaseBusiness size={19}/><span>Portfolio</span></Link>
   <Link className={active("/trading-lab")?"on":""} href="/trading-lab"><FlaskConical size={19}/><span>Trading Lab</span></Link>
  </nav>
  <footer className="v65LegalFooter"><div className="v65FooterBrand"><b>NIVORA Intelligence</b><span>Complex market data. One clear decision.</span></div><div className="v65FooterLinks"><span>© 2026 NIVORA</span><Link href="/about">Why NIVORA</Link><Link href="/terms">Legal</Link><Link href="/privacy">Privacy</Link></div></footer>
 </>
}
