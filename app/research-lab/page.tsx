import AppShell from '@/components/AppShell';
import AuthGuard from '@/components/AuthGuard';
import GlassResearchLab from '@/components/research/GlassResearchLab';
export default function ResearchLab(){return <AuthGuard><AppShell><GlassResearchLab/></AppShell></AuthGuard>}
