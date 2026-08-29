"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {createBrowserClient} from "@supabase/ssr";
import {useEffect,useRef,useState} from "react";
import {House,Search,Star,BriefcaseBusiness,UserRound,Bell,Settings} from "lucide-react";

export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname(),router=useRouter(),[open,setOpen]=useState(false),[email,setEmail]=useState(""),ref=useRef<HTMLDivElement>(null);
 const sb=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
 useEffect(()=>{sb.auth.getSession().then(({data})=>setEmail(data.session?.user.email||""));const h=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h)},[]);
 async function logout(){await sb.auth.signOut();router.replace("/login");router.refresh()}
 const active=(p:string)=>path===p||path.startsWith(p+"/");
 return <>
  <header className="osHeader v12Header">
   <Link className="osLogo" href="/dashboard">NIVORA<span>.</span></Link>
   <nav className="osDesktopNav" aria-label="Primary">
    <Link className={active("/dashboard")?"on":""} href="/dashboard">Today</Link>
    <Link className={active("/analyze")||active("/stock")?"on":""} href="/analyze">Analyze</Link>
    <Link className={active("/watchlist")?"on":""} href="/watchlist">Watchlist</Link>
    <Link className={active("/portfolio")?"on":""} href="/portfolio">Portfolio</Link>
   </nav>
   <div className="osAccount" ref={ref}><button onClick={()=>setOpen(!open)} aria-label="Account">{(email?.[0]||"N").toUpperCase()}</button>{open&&<div className="osAccountMenu"><small>{email}</small><Link href="/profile"><UserRound size={14}/>Profile</Link><Link href="/alerts"><Bell size={14}/>Alerts</Link><Link href="/profile"><Settings size={14}/>Settings</Link><button onClick={logout}>Log out</button></div>}</div>
  </header>
  <main className="osMain v12Main">{children}</main>
  <nav className="osMobileNav v12MobileNav" aria-label="Mobile navigation">
   <Link className={active("/dashboard")?"on":""} href="/dashboard"><House size={19}/><span>Today</span></Link>
   <Link className={active("/analyze")||active("/stock")?"on":""} href="/analyze"><Search size={19}/><span>Analyze</span></Link>
   <Link className={active("/watchlist")?"on":""} href="/watchlist"><Star size={19}/><span>Watchlist</span></Link>
   <Link className={active("/portfolio")?"on":""} href="/portfolio"><BriefcaseBusiness size={19}/><span>Portfolio</span></Link>
  </nav>
 </>
}
