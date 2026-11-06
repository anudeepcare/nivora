import { headers } from "next/headers";
import { notFound } from "next/navigation";
import DesignPreview from "@/components/v2/DesignPreview";
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
  return <DesignPreview />;
}
