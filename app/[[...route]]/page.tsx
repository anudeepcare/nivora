import { isProductPage } from "@/lib/page-routing";
import {
  routeMetadata,
  organizationSchema,
  websiteSchema,
} from "@/lib/site-metadata";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Product from "@/components/Product";
import Contact from "@/components/Contact";
import Plans from "@/components/Plans";
import PublicLanding from "@/components/PublicLanding";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ route?: string[] }>;
}) {
  return routeMetadata("/" + ((await params).route || []).join("/"));
}
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
  if (!isProductPage("/" + path.join("/"))) notFound();
  if (
    !preview &&
    (!route.length || (route.length === 1 && route[0] === "sample"))
  )
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationSchema, websiteSchema]),
          }}
        />
        <PublicLanding sampleOnly={route[0] === "sample"} />
      </>
    );
  if (!preview && route[0] === "pricing") return <Plans publicPage />;
  if (!preview && route[0] === "contact") return <Contact />;
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
