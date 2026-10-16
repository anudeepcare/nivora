"use client";
import {useRouter} from 'next/navigation';import AuthGuard from '@/components/AuthGuard';import AuthShell from '@/components/auth/AuthShell';import AppearanceSettings from '@/components/AppearanceSettings';import {readAurynAppearance} from '@/components/ThemeProvider';
export default function Page(){const r=useRouter();return <AuthGuard><AuthShell title="Customize your experience" subtitle="Choose your theme, layout, and preferences."><AppearanceSettings onSave={()=>r.push(readAurynAppearance().primaryView)}/></AuthShell></AuthGuard>}
