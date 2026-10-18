"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Home,
  ChartNoAxesCombined,
  Bookmark,
  PieChart,
  Search as SearchIcon,
  Bell,
  X,
} from "lucide-react";
import { Logo } from "./Ui";
import Search from "./Search";
import SettingsSheet from "./SettingsSheet";
import { useProduct } from "./Session";
import {
  NavigationMemory,
  restoreWhenReady,
  browserScrollEnvironment,
} from "@/lib/navigation";
const primary = [
  { path: "overview", label: "Home", icon: Home },
  { path: "research", label: "Research", icon: ChartNoAxesCombined },
  { path: "watchlist", label: "Watchlist", icon: Bookmark },
  { path: "portfolio", label: "Portfolio", icon: PieChart },
];
export default function Shell({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  const { demo, workspace } = useProduct();
  const pathname = usePathname();
  const memory = useRef(new NavigationMemory());
  const pending = useRef<{ path: string; top: number } | null>(null);
  const prefix = demo ? "/preview" : "";
  const search = useRef<HTMLDialogElement>(null);
  const settings = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    let cancel: (() => void) | undefined;
    if (pending.current?.path === pathname) {
      cancel = restoreWhenReady(
        pending.current.top,
        browserScrollEnvironment(),
      );
      pending.current = null;
    }
    const remember = () => memory.current.remember(pathname, window.scrollY);
    window.addEventListener("scroll", remember, { passive: true });
    return () => {
      cancel?.();
      window.removeEventListener("scroll", remember);
    };
  }, [pathname]);
  useEffect(() => {
    search.current?.close();
    settings.current?.close();
  }, [pathname]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (document.querySelector("dialog[open]") && !search.current?.open)
          return;
        search.current?.showModal();
        search.current?.querySelector("input")?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const nav = (r: (typeof primary)[number], mobile = false) => {
    const Icon = r.icon;
    return (
      <Link
        key={r.path}
        href={`${prefix}/${r.path}`}
        scroll={false}
        onNavigate={(event) => {
          const destination = `${prefix}/${r.path}`;
          const top = memory.current.navigate(
            pathname,
            destination,
            window.scrollY,
          );
          if (top == null) {
            event.preventDefault();
            return;
          }
          pending.current = { path: destination, top };
        }}
        className={page === r.path ? "active" : ""}
        aria-label={r.label}
        aria-current={page === r.path ? "page" : undefined}
      >
        {mobile && <Icon size={22} />}
        <span>{r.label}</span>
      </Link>
    );
  };
  return (
    <div className="product">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <Link
          href={`${prefix}/overview`}
          className="brand-link"
          aria-label="AURYN home"
        >
          <Logo />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {primary.map((r) => nav(r))}
        </nav>
        <button
          className="top-search"
          aria-label="Search companies and crypto"
          aria-haspopup="dialog"
          onClick={() => {
            search.current?.showModal();
            search.current
              ?.querySelector("input")
              ?.focus({ preventScroll: true });
          }}
        >
          <SearchIcon size={19} />
          <span>Find a company</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className="top-actions">
          <Link
            className="icon-button"
            href={`${prefix}/alerts`}
            aria-label="Price alerts"
          >
            <Bell size={21} />
          </Link>
          <button
            className="icon-button"
            aria-label="Settings"
            aria-haspopup="dialog"
            onClick={() => settings.current?.showModal()}
          >
            <span className="avatar">
              {(workspace?.email?.[0] || "A").toUpperCase()}
            </span>
          </button>
        </div>
      </header>
      <main id="content" className="content" tabIndex={-1}>
        {demo && (
          <div className="preview-label">
            Design preview · Illustrative data · Account actions disabled
          </div>
        )}
        {children}
      </main>
      <nav className="mobile-dock" aria-label="Mobile navigation">
        {primary.map((r) => nav(r, true))}
      </nav>
      <dialog
        className="search-dialog"
        ref={search}
        aria-label="Search companies and crypto"
      >
        <header className="dialog-head">
          <h2>Find a company</h2>
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => search.current?.close()}
          >
            <X size={21} />
          </button>
        </header>
        <Search autoFocus onNavigate={() => search.current?.close()} />
      </dialog>
      <SettingsSheet dialog={settings} />
    </div>
  );
}
