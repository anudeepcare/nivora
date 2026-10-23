import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Product from "@/components/Product";
import PublicLanding from "@/components/PublicLanding";
export const dynamic = "force-dynamic";
const allowed = new Set([
  "overview",
  "research",
  "portfolio",
  "watchlist",
  "settings",
  "owner",
  "compare",
  "alerts",
  "research-lab",
  "trading",
  "discover",
  "help",
  "terms",
  "privacy",
  "risk",
  "methodology",
  "reliability",
  "login",
  "reset-password",
  "sample",
]);
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ route?: string[] }>;
  searchParams: Promise<{ symbols?: string }>;
}) {
  const path = (await params).route || [],
    preview = path[0] === "preview",
    route = preview ? path.slice(1) : path;
  if (route[0] && !allowed.has(route[0])) notFound();
  if (route.length > 1 && route[0] !== "research") notFound();
  if (!preview && (!route.length || (route.length === 1 && route[0] === "sample"))) return <PublicLanding sampleOnly={route[0] === "sample"}/>;
  let demo;
  if (preview) {
    const host = (await headers()).get("host") || "";
    if (
      process.env.AURYN_ENABLE_PREVIEW !== "true" ||
      !/^((127\.0\.0\.1|localhost|terminal\.local)(:\d+)?$)/.test(host)
    )
      notFound();
    demo = (await import("@/tests/fixtures/demo")).demoData;
  }
  return (
    <Product
      route={route}
      demo={demo}
      compareSymbols={(await searchParams).symbols}
    />
  );
}
