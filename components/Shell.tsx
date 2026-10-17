"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  ChartNoAxesCombined,
  Bookmark,
  PieChart,
  Bell,
  Settings,
  Sun,
  Moon,
  Search as SearchIcon,
  X,
  LogOut,
  Compass,
  FlaskConical,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Logo, Notice } from "./Ui";
import Search from "./Search";
import { useProduct } from "./Session";
import { authClient } from "@/lib/client";
const primary = [
  { path: "overview", label: "Overview", icon: Home },
  { path: "research", label: "Research", icon: ChartNoAxesCombined },
  { path: "watchlist", label: "Watchlist", icon: Bookmark },
  { path: "portfolio", label: "Portfolio", icon: PieChart },
];
const secondary = [
  { path: "discover", label: "Discover", icon: Compass },
  { path: "alerts", label: "Alerts", icon: Bell },
  { path: "research-lab", label: "Research lab", icon: ShieldCheck },
  { path: "trading", label: "Paper trading", icon: FlaskConical },
  { path: "settings", label: "Settings", icon: Settings },
  { path: "help", label: "Help", icon: HelpCircle },
];
export default function Shell({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  const { demo, workspace, theme, setTheme } = useProduct(),
    prefix = demo ? "/preview" : "",
    account = useRef<HTMLDivElement>(null),
    top = useRef<HTMLElement>(null),
    [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [page]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setSearch(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch(true);
        requestAnimationFrame(() =>
          top.current?.querySelector<HTMLInputElement>("input")?.focus(),
        );
      }
    };
    const outside = (e: PointerEvent) => {
      if (!account.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  const nav = (r: (typeof primary)[number]) => {
    const Icon = r.icon;
    return (
      <Link
        key={r.path}
        href={`${prefix}/${r.path}`}
        className="nav-link"
        aria-current={page === r.path ? "page" : undefined}
        title={r.label}
      >
        <Icon size={20} />
        <span>{r.label}</span>
      </Link>
    );
  };
  async function logout() {
    if (demo) {
      setError("This preview has no signed-in account.");
      return;
    }
    try {
      const { error } = await authClient().auth.signOut();
      if (error) throw error;
    } catch {
      setError("Sign out failed. Please try again.");
    }
  }
  return (
    <div className="product">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href={`${prefix}/overview`} className="brand-link">
          <Logo />
        </Link>
        <nav aria-label="Primary">{primary.map(nav)}</nav>
        <nav className="secondary-nav" aria-label="Tools">
          {secondary.map(nav)}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">
            {demo ? "AP" : (workspace?.email?.[0] || "A").toUpperCase()}
          </span>
          <span>
            <b>{demo ? "Design preview" : "Your workspace"}</b>
            <small>{demo ? "Illustrative data" : "Private account"}</small>
          </span>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar" ref={top} data-search-open={search}>
          <Link className="mobile-brand" href={`${prefix}/overview`}>
            <Logo />
          </Link>
          <div className="top-search">
            <Search />
          </div>
          <button
            className="icon-button mobile-search"
            aria-label={search ? "Close search" : "Open search"}
            onClick={() => {
              setSearch(!search);
              if (!search)
                requestAnimationFrame(() =>
                  top.current
                    ?.querySelector<HTMLInputElement>("input")
                    ?.focus(),
                );
            }}
          >
            {search ? <X size={20} /> : <SearchIcon size={20} />}
          </button>
          <button
            className="icon-button theme-switch"
            aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <div className="account" ref={account}>
            <button
              className="avatar"
              aria-label="Account and tools"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {demo ? "AP" : (workspace?.email?.[0] || "A").toUpperCase()}
            </button>
            {menu && (
              <div className="account-menu">
                <small>{workspace?.email || "Preview workspace"}</small>
                {secondary.map(nav)}
                <button className="nav-link" onClick={logout}>
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <main id="content" className="content">
          {demo && (
            <div className="preview-label">
              <span />
              Design preview · Illustrative data · Account actions disabled
            </div>
          )}
          {error && <Notice error>{error}</Notice>}
          {children}
          <footer className="footer">
            <span>AURYN · Independent investment research</span>
            <Link href={`${prefix}/help`}>Sources & methodology</Link>
          </footer>
        </main>
      </div>
      <nav className="mobile-dock" aria-label="Mobile navigation">
        {primary.map(nav)}
      </nav>
    </div>
  );
}
