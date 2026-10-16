import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import ResearchHome from '@/components/ResearchHome';
export default function Page(){return <AuthGuard><AppShell><ResearchHome/></AppShell></AuthGuard>;}
