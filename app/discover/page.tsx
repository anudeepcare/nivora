import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import ResearchWorkspace from '@/components/ResearchWorkspace';
export default function Page(){return <AuthGuard><AppShell><ResearchWorkspace mode="discover"/></AppShell></AuthGuard>;}
