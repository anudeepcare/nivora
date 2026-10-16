"use client";
import AuthGuard from '@/components/AuthGuard';
import AppShell from '@/components/AppShell';
import TrackedList from '@/components/portfolio/TrackedList';
export default function Page(){return <AuthGuard><AppShell><TrackedList alerts/></AppShell></AuthGuard>}
