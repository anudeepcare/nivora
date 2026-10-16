import AurynLogo from '@/components/AurynLogo';
import Link from 'next/link';
type Props={eyebrow?:string;title:string;subtitle:string;storyTitle?:string;storyBody?:string;points?:string[];children:React.ReactNode};
export default function AuthShell({title,subtitle,children}:Props){return <main className="uxAuthPage"><section className="uxAuthCard"><AurynLogo href="/" compact/><header><h1>{title}</h1><p>{subtitle}</p></header>{children}</section><footer><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><span>© {new Date().getFullYear()} AURYN</span></footer></main>}
