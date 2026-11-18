"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { authClient } from "@/lib/client";
/** Navigation only; authentication and access remain enforced by the workspace. */
export default function PublicHomeLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [href, setHref] = useState("/");
  useEffect(() => {
    let active = true,
      changed = false,
      unsubscribe: (() => void) | undefined;
    try {
      const auth = authClient().auth;
      const subscription = auth.onAuthStateChange((_event, session) => {
        changed = true;
        if (active) setHref(session?.user ? "/overview" : "/");
      });
      unsubscribe = () => subscription.data.subscription.unsubscribe();
      void auth
        .getSession()
        .then(({ data }) => {
          if (active && !changed)
            setHref(data.session?.user ? "/overview" : "/");
        })
        .catch(() => {});
    } catch {
      /* Public documents remain readable when authentication is unavailable. */
    }
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  return (
    <Link
      href={href}
      className={className}
      aria-label={href === "/overview" ? "AURYN workspace" : "AURYN home"}
    >
      {children}
    </Link>
  );
}
