import AuthGuard from "@/components/AuthGuard";import AppShell from "@/components/AppShell";import TodayClient from "@/components/TodayClient";
export default function Dashboard(){return <AuthGuard><AppShell><TodayClient/></AppShell></AuthGuard>}
