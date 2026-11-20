"use client";
import Link from "next/link";
import { authClient } from "@/lib/client";
import { restoreWhenReady, browserScrollEnvironment } from "@/lib/navigation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import {
  documentBackTarget,
  documentHref,
  documentReturnHref,
} from "@/lib/settings-navigation";

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
  const [target, setTarget] = useState(() => ({
    href: "/",
    label: "Back to home",
  }));
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    const from = new URLSearchParams(query).get("from");
    let active = true;
    let revision = 0;
    let unsubscribe: (() => void) | undefined;
    setTarget(documentBackTarget(from, false));
    try {
      const auth = authClient().auth;
      const verify = () => {
        const attempt = ++revision;
        void auth
          .getUser()
          .then(({ data, error }) => {
            if (active && revision === attempt)
              setTarget(documentBackTarget(from, !error && !!data.user));
          })
          .catch(() => {});
      };
      const subscription = auth.onAuthStateChange((_event, session) => {
        const attempt = ++revision;
        if (!session?.user) {
          if (active) setTarget(documentBackTarget(from, false));
          return;
        }
        // Leave the auth callback lock before verifying with the server.
        setTimeout(() => {
          if (active && revision === attempt) verify();
        }, 0);
      });
      unsubscribe = () => subscription.data.subscription.unsubscribe();
      verify();
    } catch {
      // Never infer sign-in from a return URL or from missing authentication.
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [pathname, query]);
  return (
    <Link href={target.href} scroll={false}>
      <span aria-hidden="true">← </span>
      {target.label}
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
