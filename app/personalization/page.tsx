"use client";
import Link from 'next/link';
import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import AppearanceSettings from '@/components/AppearanceSettings';
import {Panel,PageHeading,DataRow} from '@/components/glass/GlassUi';
export default function Page(){return <AuthGuard><AppShell><section><PageHeading title="Settings" subtitle="Your appearance and account preferences."/><div className="settingsLayout"><Panel title="Appearance"><AppearanceSettings/></Panel><aside className="settingsAside"><h2>Your account</h2><div className="au-list"><DataRow label="Profile & privacy" value={<Link className="au-link" href="/profile">Manage →</Link>}/><DataRow label="Saved research" value={<Link className="au-link" href="/watchlist">Open →</Link>}/><DataRow label="Alpaca Paper" value={<Link className="au-link" href="/trading-lab">Check connection →</Link>}/></div><p className="au-small au-muted">Quotes and company filings show their source and timestamp on each investment.</p><Link className="au-link au-support" href="/privacy">Privacy details →</Link></aside></div></section></AppShell></AuthGuard>}
