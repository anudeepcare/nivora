import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import AccumulationWorkbench from './workbench';
export default function AccumulationPage(){return <AuthGuard><AppShell><AccumulationWorkbench/></AppShell></AuthGuard>}
