import AuthGuard from "@/components/AuthGuard";import AppShell from "@/components/AppShell";import InvestorRadarClient from "@/components/InvestorRadarClient";
export default function Dashboard(){return <AuthGuard><AppShell><InvestorRadarClient/></AppShell></AuthGuard>}
