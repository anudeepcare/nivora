"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Home,
  ChartNoAxesCombined,
  Bookmark,
  PieChart,
  Settings,
  Sun,
  Moon,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { Logo } from "./Ui";
import Search from "./Search";
import { useProduct } from "./Session";
const primary = [
  { path: "overview", label: "Overview", icon: Home },
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
  const prefix = demo ? "/preview" : "",
    search = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    search.current?.close();
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
        className="nav-item"
        aria-label={r.label}
        title={r.label}
        aria-current={page === r.path ? "page" : undefined}
      >
        <Icon size={21} />
        <span>{r.label}</span>
      </Link>
    );
  };
  return (
    <div className="product">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link
          href={`${prefix}/overview`}
          className="brand-link"
          aria-label="AURYN overview"
        >
          <Logo />
        </Link>
        <nav className="main-nav" aria-label="Primary">
          {primary.map(nav)}
        </nav>
        <div className="sidebar-bottom">
          <Link
            href={`${prefix}/settings`}
            className="nav-item"
            aria-label="Preferences"
            title="Preferences"
            aria-current={page === "settings" ? "page" : undefined}
          >
            <Settings size={21} />
            <span>Preferences</span>
          </Link>
          <div className="profile">
            <span className="avatar">
              {(workspace?.email?.[0] || "A").toUpperCase()}
            </span>
            <div>
              <strong>{demo ? "Design preview" : "Your workspace"}</strong>
              <small>{demo ? "Illustrative data" : "Private account"}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <Link
            className="mobile-brand"
            href={`${prefix}/overview`}
            aria-label="AURYN overview"
          >
            <Logo />
          </Link>
          <div className="top-search">
            <Search />
          </div>
          <div className="top-actions">
            <button
              className="icon-button mobile-search"
              aria-label="Search companies and crypto"
              aria-haspopup="dialog"
              onClick={() => {
                search.current?.showModal();
                search.current
                  ?.querySelector("input")
                  ?.focus({ preventScroll: true });
              }}
            >
              <SearchIcon size={21} />
            </button>
            <button
              className="icon-button"
              aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun size={21} /> : <Moon size={21} />}
            </button>
            <Link
              className="icon-button"
              href={`${prefix}/settings`}
              aria-label="Preferences"
              aria-current={page === "settings" ? "page" : undefined}
            >
              <Settings size={21} />
            </Link>
          </div>
        </header>
        <main id="content" className="content" tabIndex={-1}>
          {demo && (
            <div className="preview-label">
              Design preview · Illustrative data · Account actions disabled
            </div>
          )}
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
      <dialog
        className="search-dialog"
        ref={search}
        aria-label="Search companies and crypto"
      >
        <div className="dialog-head">
          <h2>Find your next idea</h2>
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={() => search.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <Search autoFocus onNavigate={() => search.current?.close()} />
      </dialog>
    </div>
  );
}
