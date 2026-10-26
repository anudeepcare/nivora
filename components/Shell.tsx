"use client";
import { AccessNotice } from "./Access";
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
  LayoutGrid,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { Logo, ProductFooter } from "./Ui";
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
  const { demo, workspace, theme, setTheme } = useProduct();
  const pathname = usePathname();
  const memory = useRef(new NavigationMemory());
  const pending = useRef<{ path: string; top: number } | null>(null);
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const search = useRef<HTMLDialogElement>(null);
  const settings = useRef<HTMLDialogElement>(null);
  const tools = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const env = browserScrollEnvironment();
    const top =
      pending.current?.path === pathname
        ? pending.current.top
        : memory.current.position(pathname);
    const cancel = restoreWhenReady(top, env);
    pending.current = null;
    const remember = () =>
      memory.current.remember(pathname, env.readTop?.() ?? window.scrollY);
    let stop: () => void;
    if (env.onScroll) stop = env.onScroll(remember);
    else {
      window.addEventListener("scroll", remember, { passive: true });
      stop = () => window.removeEventListener("scroll", remember);
    }
    return () => {
      cancel();
      stop();
    };
  }, [pathname]);
  useEffect(() => {
    search.current?.close();
    settings.current?.close();
    tools.current?.close();
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
            browserScrollEnvironment().readTop?.() ?? window.scrollY,
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
        <Icon size={22} />
        <span>{r.label}</span>
      </Link>
    );
  };
  return (
    <div className="product approved-product app-layout" data-page={page}>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="side-rail">
        <Link
          href={`${prefix}/overview`}
          className="rail-brand"
          aria-label="AURYN home"
        >
          <img src="/icon.svg" width="36" height="36" alt="" />
        </Link>
        <nav aria-label="Main navigation">{primary.map((r) => nav(r))}</nav>
        <div className="rail-bottom">
          <button
            onClick={() => tools.current?.showModal()}
            aria-label="More tools"
          >
            <LayoutGrid size={21} />
            <span>Explore</span>
          </button>
          <Link
            href={`${prefix}/settings`}
            className={page === "settings" ? "active" : ""}
          >
            <Settings size={21} />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-top topbar">
          <Link className="wordmark" href={`${prefix}/overview`}>
            AURYN{" "}
            <span>
              /{" "}
              {primary.find((r) => r.path === page)?.label ||
                page.replaceAll("-", " ")}
            </span>
          </Link>
          <button
            className="search-box"
            aria-label="Search companies and crypto"
            aria-haspopup="dialog"
            onClick={() => {
              search.current?.showModal();
              search.current
                ?.querySelector("input")
                ?.focus({ preventScroll: true });
            }}
          >
            <SearchIcon size={18} />
            <span>Find a company</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="top-links">
            <button
              className="icon-button mobile-explore"
              aria-label="Explore tools"
              onClick={() => tools.current?.showModal()}
            >
              <LayoutGrid size={20} />
            </button>
            <Link href={`${prefix}/plans`}>Plans</Link>
            <button
              className="icon-button"
              aria-label="Switch color theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Link
              href={`${prefix}/alerts`}
              className="icon-button"
              aria-label="Price alerts"
            >
              <Bell size={20} />
            </Link>
            <button
              className="avatar"
              aria-label="Account settings"
              onClick={() => settings.current?.showModal()}
            >
              {(workspace?.email?.[0] || "A").toUpperCase()}
            </button>
          </div>
        </header>
        <main id="content" className="page-content" tabIndex={-1}>
          <AccessNotice />
          {demo && demo.routePrefix !== "" && (
            <div className="preview-label">
              Design preview · Illustrative data · Account actions disabled
            </div>
          )}
          {children}
          <ProductFooter />
        </main>
      </div>
      <nav className="phone-dock" aria-label="Mobile navigation">
        {primary.map((r) => nav(r, true))}
      </nav>
      <dialog
        ref={tools}
        className="search-dialog approved-tools-dialog"
        aria-label="Explore your workspace"
      >
        <header className="dialog-head">
          <h2>Explore your workspace</h2>
          <button
            className="icon-button"
            aria-label="Close tools"
            onClick={() => tools.current?.close()}
          >
            <X size={21} />
          </button>
        </header>
        <div className="dialog-tools">
          {[
            ["discover", "Discover", "Find your next research idea"],
            ["research-lab", "Research Lab", "Investigate the evidence"],
            ["trading", "Paper Lab", "Test a strategy"],
            ["compare", "Compare", "See companies side by side"],
            ["help", "Help", "Understand the tools"],
            ["settings", "Settings", "Make AURYN yours"],
          ].map(([path, label, detail]) => (
            <Link key={path} href={`${prefix}/${path}`}>
              <strong>{label}</strong>
              <small>{detail}</small>
            </Link>
          ))}
        </div>
      </dialog>
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
