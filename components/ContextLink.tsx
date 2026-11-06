"use client";
import Link from "next/link";
import { restoreWhenReady, browserScrollEnvironment } from "@/lib/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { documentHref, documentReturnHref } from "@/lib/settings-navigation";

export function ContextLink({
  page,
  children,
  className,
  "aria-current": ariaCurrent,
}: {
  page: string;
  children: ReactNode;
  className?: string;
  "aria-current"?: "page";
}) {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const router = useRouter();
  const [href, setHref] = useState(`/${page}`);
  useEffect(() => {
    setHref(
      documentHref(
        page,
        window.location.pathname +
          window.location.search +
          window.location.hash,
      ),
    );
  }, [page, pathname, query]);
  return (
    <Link
      href={href}
      className={className}
      aria-current={ariaCurrent}
      onNavigate={(event) => {
        event.preventDefault();
        router.push(
          documentHref(
            page,
            window.location.pathname +
              window.location.search +
              window.location.hash,
          ),
        );
      }}
      onClick={() => {
        try {
          const current = documentReturnHref(
            window.location.pathname +
              window.location.search +
              window.location.hash,
          );
          if (
            current ===
            window.location.pathname +
              window.location.search +
              window.location.hash
          )
            sessionStorage.setItem(
              "auryn-document-scroll",
              JSON.stringify({ href: current, top: window.scrollY }),
            );
        } catch {}
      }}
    >
      {children}
    </Link>
  );
}
export function DocumentBack() {
  const [href, setHref] = useState("/overview");
  useEffect(() => {
    setHref(
      documentReturnHref(
        new URLSearchParams(window.location.search).get("from"),
      ),
    );
  }, []);
  return (
    <Link href={href} scroll={false}>
      ← Back to {href === "/" ? "home" : "your workspace"}
    </Link>
  );
}

export function DocumentScrollReturn() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("auryn-document-scroll") || "null",
      );
      if (
        saved?.href ===
          window.location.pathname +
            window.location.search +
            window.location.hash &&
        Number.isFinite(saved.top)
      ) {
        sessionStorage.removeItem("auryn-document-scroll");
        return restoreWhenReady(saved.top, browserScrollEnvironment());
      }
    } catch {}
  }, [pathname]);
  return null;
}
