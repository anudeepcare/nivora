import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { allowedPreview } from "@/lib/presentation/preview";
export const dynamic = "force-dynamic";
export default async function Page() {
  if (
    !allowedPreview(
      (await headers()).get("host") || "",
      process.env.AURYN_ENABLE_PREVIEW,
    )
  )
    notFound();
  if (process.env.NODE_ENV !== "production") {
    const { default: DesignPreview } = await import(
      "@/components/v2/DesignPreview"
    );
    return <DesignPreview />;
  }
  notFound();
}
