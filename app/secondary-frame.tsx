import Link from 'next/link';
import type {ReactNode} from 'react';
import AppShell from '@/components/AppShell';
import {PageHeading} from '@/components/glass/GlassUi';
import './secondary-redesign.css';
export default function SecondaryFrame({title,intro,children}:{eyebrow:string;title:string;intro?:string;children:ReactNode}){return <AppShell><section className="glassInformation"><PageHeading title={title} subtitle={intro}/>{children}<footer className="au-footer"><span>© AURYN · Research with perspective.</span><div><Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link></div></footer></section></AppShell>}
