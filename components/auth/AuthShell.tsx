import AurynLogo from '@/components/AurynLogo';
import Link from 'next/link';
type Props={eyebrow?:string;title:string;subtitle:string;storyTitle?:string;storyBody?:string;points?:string[];children:React.ReactNode};
export default function AuthShell({title,subtitle,children}:Props){return <main className="aurynGlass authPage"><section className="au-auth"><div className="au-brand"><AurynLogo href="/" compact/></div><header className="au-head"><div><h1>{title}</h1><p>{subtitle}</p></div></header>{children}<footer className="au-footer"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer></section></main>}
