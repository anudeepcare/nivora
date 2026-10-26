"use client";
import { AccessNotice } from "./Access";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Compass,
  FlaskConical,
  Scale,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react";
import { Logo, ProductFooter } from "./Ui";
import Search from "./Search";
import { settingsHref } from "@/lib/settings-navigation";
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
  const router = useRouter();
  const memory = useRef(new NavigationMemory());
  const pending = useRef<{ path: string; top: number } | null>(null);
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const search = useRef<HTMLDialogElement>(null);
  const tools = useRef<HTMLDialogElement>(null);
  const openSettings = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    tools.current?.close();
    if (page === "settings") return;
    router.push(
      settingsHref(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
        prefix,
      ),
    );
  };
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
            aria-label="Explore tools"
            aria-haspopup="dialog"
          >
            <LayoutGrid size={21} />
            <span>Explore</span>
          </button>
          <Link
            href={`${prefix}/settings`}
            onNavigate={openSettings}
            className={page === "settings" ? "active" : ""}
            aria-current={page === "settings" ? "page" : undefined}
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
                page
                  .replaceAll("-", " ")
                  .replace(/\b\w/g, (letter) => letter.toUpperCase())}
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
              aria-haspopup="dialog"
              onClick={() => tools.current?.showModal()}
            >
              <LayoutGrid size={20} />
            </button>
            <Link
              href={`${prefix}/plans`}
              className="header-plans"
              aria-current={page === "plans" ? "page" : undefined}
            >
              Plans
            </Link>
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
            <Link
              href={`${prefix}/settings`}
              className="avatar"
              aria-label="Account settings"
              onNavigate={openSettings}
              aria-current={page === "settings" ? "page" : undefined}
            >
              {(workspace?.email?.[0] || "A").toUpperCase()}
            </Link>
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
        aria-label="Explore tools"
      >
        <header className="dialog-head">
          <div>
            <span className="eyebrow">Your workspace</span>
            <h2>Explore tools</h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close tools"
            onClick={() => tools.current?.close()}
          >
            <X size={21} />
          </button>
        </header>
        <p className="tools-intro">
          Discover ideas, compare companies, and test your thinking.
        </p>
        <div className="dialog-tools">
          {[
            {
              path: "discover",
              label: "Discover",
              detail: "Find your next research idea",
              icon: Compass,
            },
            {
              path: "compare",
              label: "Compare",
              detail: "See companies side by side",
              icon: Scale,
            },
            {
              path: "research-lab",
              label: "Research Lab",
              detail: "Investigate the evidence",
              icon: FlaskConical,
            },
            {
              path: "trading",
              label: "Paper Lab",
              detail: "Practice with a paper portfolio",
              icon: ChartNoAxesCombined,
            },
            {
              path: "help",
              label: "Help & support",
              detail: "Understand the tools",
              icon: HelpCircle,
            },
            {
              path: "settings",
              label: "Settings",
              detail: "Account and preferences",
              icon: Settings,
            },
          ]
            .filter((tool) => tool.path !== page)
            .map(({ path, label, detail, icon: Icon }) => (
              <Link
                key={path}
                href={`${prefix}/${path}`}
                onNavigate={
                  path === "settings"
                    ? openSettings
                    : () => tools.current?.close()
                }
              >
                <span className="tool-icon">
                  <Icon size={21} />
                </span>
                <span>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowUpRight size={17} className="tool-arrow" />
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
    </div>
  );
}
