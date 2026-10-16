import AuthGuard from "@/components/AuthGuard";import AppShell from "@/components/AppShell";import StockClient from "@/components/StockClient";
export default async function StockPage({params}:{params:Promise<{symbol:string}>}){const {symbol}=await params;return <AuthGuard><AppShell><StockClient symbol={decodeURIComponent(symbol).toUpperCase()}/></AppShell></AuthGuard>}
