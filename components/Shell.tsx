"use client";
import experience from "./WorkspaceShell.module.css";
import { AccessNotice, useAccess } from "./Access";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  Home,
  Ellipsis,
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
import { ProductFooter } from "./Ui";
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
  const { access } = useAccess();
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
  const nav = (r: (typeof primary)[number]) => {
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
        data-destination={r.path}
        aria-label={r.label}
        aria-current={page === r.path ? "page" : undefined}
      >
        <Icon size={22} />
        <span>{r.label}</span>
      </Link>
    );
  };
  return (
    <div
      className={`product approved-product ${experience.shell}`}
      data-page={page}
      data-shell="mobile-first"
    >
      <a className={experience.skip} href="#content">
        Skip to content
      </a>
      <header className={experience.header}>
        <Link href={`${prefix}/overview`} className={experience.brand} aria-label="AURYN home">
          <img src="/icon.svg" width="32" height="32" alt="" /><span>AURYN</span>
        </Link>
        <nav className={experience.nav} aria-label="Main navigation">
          {primary.map(nav)}
          <Link href={`${prefix}/discover`} aria-current={page === "discover" ? "page" : undefined}>Discover</Link>
          <button onClick={() => tools.current?.showModal()} aria-haspopup="dialog" aria-label="More workspace actions"><Ellipsis size={20} /><span>More</span></button>
        </nav>
        <button
          className={experience.searchTrigger}
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
          <span>Find a company or ticker</span>
          <kbd>⌘ K</kbd>
        </button>
        <div className={experience.actions}>
          <button
            aria-label="Switch color theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Moon size={19} /> : <Sun size={19} />}
          </button>
          <Link href={`${prefix}/alerts`} aria-label="Price alerts">
            <Bell size={19} />
          </Link>
          <Link
            href={`${prefix}/settings`}
            aria-label="Account settings"
            onNavigate={openSettings}
          >
            {(workspace?.email?.[0] || "A").toUpperCase()}
          </Link>
        </div>
      </header>
      <div className={experience.workspace}>
        <main id="content" className={experience.content} tabIndex={-1}>
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
      <nav className={experience.dock} aria-label="Mobile navigation">
        {primary.map((r) => nav(r))}
        <button
          onClick={() => tools.current?.showModal()}
          aria-label="More workspace actions"
          aria-haspopup="dialog"
        >
          <Ellipsis size={20} />
          <span>More</span>
        </button>
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
              label: "Strategy lab",
              detail: "Test a contribution strategy",
              icon: FlaskConical,
            },
            {
              path: "trading",
              label: "Paper trading",
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
            {
              path: "plans",
              label: "Plans",
              detail: "Membership and access",
              icon: Scale,
            },
            {
              path: "alerts",
              label: "Price alerts",
              detail: "Review your saved alerts",
              icon: Bell,
            },
          ]
            .filter(
              (tool) =>
                tool.path !== page &&
                (tool.path !== "trading" ||
                  !!demo ||
                  access.capabilities?.paperTrading),
            )
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
