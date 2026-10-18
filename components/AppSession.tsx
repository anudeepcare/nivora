"use client";
import { usePathname } from "next/navigation";
import { ProductSession } from "./Session";
import Shell from "./Shell";

// Lives in the root layout, above the changing catch-all route segment.
// Account state, navigation and cached quotes survive ordinary page changes.
export default function AppSession({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/preview" || pathname.startsWith("/preview/"))
    return <>{children}</>;
  const page = pathname.split("/")[1] || "overview";
  if (["terms", "privacy", "risk", "methodology", "help"].includes(page)) return <>{children}</>;
  return (
    <ProductSession>
      <Shell page={page}>{children}</Shell>
    </ProductSession>
  );
}
