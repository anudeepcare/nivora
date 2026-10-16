"use client";
import {navigateToLogin} from '@/lib/client-auth-navigation';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {BriefcaseBusiness,FlaskConical,LogOut,Radar,Search,UserRound,Star,Sun,Compass,Settings,X,HelpCircle,BookOpen} from 'lucide-react';
import {supabaseBrowser} from '@/lib/supabase';
import AurynLogo from './AurynLogo';
import SearchBox from './SearchBox';
const nav=[{href:'/analyze',label:'Research',icon:Search},{href:'/portfolio',label:'Portfolio',icon:BriefcaseBusiness},{href:'/alerts',label:'Monitor',icon:Radar},{href:'/trading-lab',label:'Trading Lab',icon:FlaskConical}];
export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname(),menuRef=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false),[email,setEmail]=useState('');
 const home=path==='/analyze'||path==='/dashboard';
 const active=(href:string)=>path===href||(href==='/analyze'&&path.startsWith('/stock/'));
 useEffect(()=>{let alive=true;try{supabaseBrowser().auth.getSession().then(({data})=>{if(alive)setEmail(data.session?.user.email||'');}).catch(()=>{});}catch{}
 const close=(event:MouseEvent)=>{if(menuRef.current&&!menuRef.current.contains(event.target as Node))setOpen(false);};
 const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
 document.addEventListener('mousedown',close);document.addEventListener('keydown',escape);
 return()=>{alive=false;document.removeEventListener('mousedown',close);document.removeEventListener('keydown',escape);};},[]);
 useEffect(()=>setOpen(false),[path]);
 async function logout(){try{const{error}=await supabaseBrowser().auth.signOut();if(error)throw error;navigateToLogin();}catch{window.alert('Sign out failed. Please check your connection and try again.');}}
 const navItems=nav.map(item=>{const Icon=item.icon;return <Link key={item.href} className={active(item.href)?'on':''} aria-current={active(item.href)?'page':undefined} href={item.href}><Icon size={19}/><span>{item.label}</span></Link>;});
 return <div className="aurynAppShell"><a className="uxSkip" href="#workspace">Skip to content</a>
  <aside className="aurynSidebar"><AurynLogo compact/><span className="aurynSidebarLabel">YOUR WORKSPACE</span><nav aria-label="Desktop primary"><Link href="/dashboard" className={active("/dashboard")?"on":""}><Sun size={19}/><span>Today</span></Link>{navItems}<Link href="/discover" className={active("/discover")?"on":""}><Compass size={19}/><span>Discover</span></Link><Link href="/watchlist" className={active('/watchlist')?'on':''} aria-current={active('/watchlist')?'page':undefined}><Star size={19}/><span>Watchlist</span></Link></nav><div className="aurynSidebarBottom"><Link href="/profile"><UserRound size={18}/> Account</Link><Link href="/personalization"><Settings size={18}/> Appearance</Link><Link href="/faq"><HelpCircle size={18}/> Help & FAQ</Link><Link href="/methodology"><BookOpen size={18}/> Our methodology</Link><span>A clearer investment view.</span></div></aside>
  <div className="aurynWorkspace"><header className="aurynHeader"><div className="aurynHeaderBrand"><AurynLogo compact/></div><span className="aurynWorkspaceName">{path.startsWith('/stock/')?'Investment research':nav.find(item=>active(item.href))?.label||'Your workspace'}</span><nav className="aurynDesktopNav" aria-label="Primary">{navItems}</nav><div className="aurynHeaderRight">{!home&&<div className="aurynQuickSearch"><SearchBox compact/></div>}<Link className="uxWatchShortcut" href="/watchlist" aria-label="Watchlist"><Star size={19}/></Link><div className="aurynAccount" ref={menuRef}><button aria-label="Account menu" aria-expanded={open} aria-controls="account-menu" onClick={()=>setOpen(!open)}>{open?<X size={18}/>:(email[0]||'A').toUpperCase()}</button>{open&&<div className="aurynAccountMenu" id="account-menu"><small>{email||'Your workspace'}</small><Link href="/dashboard"><Sun size={16}/>Today</Link><Link href="/discover"><Compass size={16}/>Discover</Link><Link href="/watchlist"><Star size={16}/>Watchlist</Link><Link href="/profile"><UserRound size={16}/>Account</Link><Link href="/personalization"><Settings size={16}/>Appearance</Link><Link href="/faq"><HelpCircle size={16}/>Help & FAQ</Link><button onClick={logout}><LogOut size={16}/>Sign out</button></div>}</div></div></header>
  {!home&&<div className="aurynMobileSearch"><SearchBox compact/></div>}<main className="aurynAppMain" id="workspace">{children}</main><footer className="uxAppFooter"><span>AURYN · Research with conviction</span><Link href="/disclaimer">Research only. Investing involves risk.</Link><Link href="/methodology">Methodology</Link></footer></div>
  <nav className="aurynBottomNav" aria-label="Mobile primary">{navItems}</nav>
 </div>;
}
