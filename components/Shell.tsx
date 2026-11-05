"use client";
import { ReleaseNotice } from "./ReleaseNotes";
import experience from "./WorkspaceShell.module.css";
import { AccessNotice, useAccess } from "./Access";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  LogOut,
  Home,
  ChartNoAxesCombined,
  Bookmark,
  PieChart,
  Search as SearchIcon,
  Bell,
  X,
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
import { signOutAndRedirect } from "@/lib/client";
import { settingsHref, documentHref } from "@/lib/settings-navigation";
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
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const signOut = async () => {
    if ((demo && demo.routePrefix !== "") || signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try { await signOutAndRedirect(); }
    catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Could not sign out. Please try again.");
      setSigningOut(false);
    }
  };
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
    let top =
      pending.current?.path === pathname
        ? pending.current.top
        : memory.current.position(pathname);
    try { const saved = JSON.parse(sessionStorage.getItem('auryn-document-scroll') || 'null'); if(saved?.href === window.location.pathname+window.location.search+window.location.hash && Number.isFinite(saved.top)){top=saved.top;sessionStorage.removeItem('auryn-document-scroll');}}catch{}
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
          <button aria-label="Account and workspace tools" aria-haspopup="dialog" onClick={() => tools.current?.showModal()}>
            {(workspace?.email?.[0] || "A").toUpperCase()}
          </button>
        </div>
      </header>
      <div className={experience.workspace}>
        <main id="content" className={experience.content} tabIndex={-1}>
          <AccessNotice />
          <ReleaseNotice />
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
      </nav>
      <dialog
        ref={tools}
        className="search-dialog approved-tools-dialog"
        aria-label="Account & workspace"
      >
        <header className="dialog-head">
          <div>
            <span className="eyebrow">Your workspace</span>
            <h2>Account & workspace</h2>
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
              path: "changelog",
              label: "What’s new",
              detail: "Release notes and current version",
              icon: Bell,
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
                    : (event) => {tools.current?.close();if(["help","changelog"].includes(path)){event.preventDefault();try{sessionStorage.setItem('auryn-document-scroll',JSON.stringify({href:window.location.pathname+window.location.search+window.location.hash,top:window.scrollY}))}catch{}router.push(documentHref(path,window.location.pathname+window.location.search+window.location.hash));}}
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
        <footer className="account-menu-footer">
          <button type="button" className="button" disabled={(!!demo && demo.routePrefix !== "") || signingOut} onClick={signOut}>
            <LogOut size={17} /> {signingOut ? "Signing out…" : "Sign out"}
          </button>
          {signOutError && <p role="alert">{signOutError}</p>}
        </footer>
      </dialog>
      <dialog
        className={`search-dialog ${experience.searchDialog}`}
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
