import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import ResearchWorkspace from '@/components/ResearchWorkspace';
import TrackedList from '@/components/portfolio/TrackedList';
export default function Page(){return <AuthGuard><AppShell><ResearchWorkspace mode="alerts"/><details><summary style={{minHeight:44,padding:16,cursor:'pointer'}}>Saved price targets</summary><TrackedList alerts/></details></AppShell></AuthGuard>;}
