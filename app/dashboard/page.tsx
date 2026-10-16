"use client";
import {useEffect} from 'react';import {useRouter} from 'next/navigation';import {readAurynAppearance} from '@/components/ThemeProvider';import {supabaseBrowser} from '@/lib/supabase';import AuthGuard from '@/components/AuthGuard';
function Destination(){const r=useRouter();useEffect(()=>{let live=true;supabaseBrowser().auth.getUser().then(({data})=>{if(live)r.replace(data.user?.user_metadata?.auryn_onboarded?readAurynAppearance().primaryView:'/onboarding')});return()=>{live=false}},[r]);return <div className="uxState" role="status">Opening your workspace…</div>}
export default function Page(){return <AuthGuard><Destination/></AuthGuard>}
