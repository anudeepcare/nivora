"use client";
import { useState, useEffect, useRef } from "react";
import {
  Home,
  ChartNoAxesCombined,
  Bookmark,
  Wallet,
  Compass,
  Settings,
  Bell,
  Search,
  ArrowRight,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  GraduationCap,
  X,
  Check,
  Lock,
  Info,
  ChevronDown,
} from "lucide-react";
import { filteredCompanies, companies } from "@/lib/presentation/preview";
import { Brand, Button, Note } from "./Primitives";
import ResearchView from "./ResearchView";
import WorkspaceViews from "./WorkspaceViews";
import s from "./Preview.module.css";
const destinations = [
  ["Home", Home],
  ["Research", ChartNoAxesCombined],
  ["Watchlist", Bookmark],
  ["Portfolio", Wallet],
  ["Discover", Compass],
  ["Alerts", Bell],
] as const;
export default function DesignPreview() {
  const [page, setPage] = useState("Company");
  const [symbol, setSymbol] = useState("NOVA");
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [state, setState] = useState("Populated");
  const [toast, setToast] = useState("");
  const [evidence, setEvidence] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const publicPage = ["Public website", "Sign in"].includes(page);
  const go = (v: string) => {
    setPage(v);
    setState("Populated");
    setSearch("");
    setSearching(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const open = (v: string) => {
    setSymbol(v);
    go("Company");
  };
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (evidence) dialog.current?.showModal();
    else dialog.current?.close();
  }, [evidence]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInput.current?.focus();
        setSearching(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return (
    <div
      id="auryn-redesign"
      className={s.app}
      data-dark={dark}
      data-collapsed={collapsed}
    >
      <div className={s.reviewBar}>
        <span>
          <i /> AURYN / DESIGN PREVIEW <b>Illustrative data</b>
        </span>
        <div>
          <label>
            Screen
            <select
              aria-label="Preview screen"
              value={page}
              onChange={(e) => go(e.target.value)}
            >
              {[
                "Company",
                "Home",
                "Research",
                "Watchlist",
                "Portfolio",
                "Discover",
                "Alerts",
                "Settings",
                "Public website",
                "Sign in",
                "Plans",
                "Learn",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            State
            <select
              aria-label="Preview state"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              {[
                "Populated",
                "Loading",
                "Empty",
                "Stale",
                "Error",
                "Restricted",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {!publicPage && (
        <>
          <aside className={s.sidebar}>
            <button
              className={s.brandButton}
              onClick={() => go("Home")}
              aria-label="AURYN home"
            >
              <Brand />
            </button>
            <span className={s.navCaption}>WORKSPACE</span>
            <nav>
              {destinations.map(([label, Icon]) => (
                <button
                  key={label}
                  aria-label={label}
                  aria-current={
                    page === label ||
                    (page === "Company" && label === "Research")
                      ? "page"
                      : undefined
                  }
                  onClick={() => go(label)}
                >
                  <Icon size={19} />
                  <span>{label}</span>
                  {label === "Alerts" && <small>2</small>}
                </button>
              ))}
            </nav>
            <div className={s.sidebarBottom}>
              <button aria-label="Learn AURYN" onClick={() => go("Learn")}>
                <GraduationCap size={19} />
                <span>Learn AURYN</span>
              </button>
              <button
                aria-label="Settings"
                aria-current={page === "Settings" ? "page" : undefined}
                onClick={() => go("Settings")}
              >
                <Settings size={19} />
                <span>Settings</span>
              </button>
              <button
                aria-label="Public website"
                onClick={() => go("Public website")}
              >
                <Globe size={19} />
                <span>Public website</span>
              </button>
              <div className={s.user}>
                <span>A</span>
                <div>
                  <strong>Anudeep</strong>
                  <small>Pro · Design workspace</small>
                </div>
                <button
                  className={s.collapse}
                  onClick={() => setCollapsed(!collapsed)}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {collapsed ? (
                    <PanelLeftOpen size={16} />
                  ) : (
                    <PanelLeftClose size={16} />
                  )}
                </button>
              </div>
            </div>
          </aside>
          <header className={s.topbar}>
            <span className={s.breadcrumb}>
              Workspace <span>/</span> {page === "Company" ? "Research" : page}
            </span>
            <div className={s.searchWrap}>
              <Search size={17} />
              <input
                ref={searchInput}
                placeholder="Find a company or a new perspective"
                aria-label="Find a company"
                value={search}
                onFocus={() => setSearching(true)}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearching(false);
                  if (e.key === "Enter") {
                    const first = filteredCompanies(companies, search)[0];
                    if (first) open(first.symbol);
                  }
                }}
              />
              {search ? (
                <button
                  className={s.iconButton}
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={14} />
                </button>
              ) : (
                <kbd>⌘ K</kbd>
              )}
              {searching && (
                <div className={s.searchResults}>
                  <div className={s.sectionHead}>
                    <span>Sample companies</span>
                    <button
                      className={s.iconButton}
                      aria-label="Close search"
                      onClick={() => setSearching(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {filteredCompanies(companies, search).map((c) => (
                    <button key={c.symbol} onClick={() => open(c.symbol)}>
                      <span className={s.miniLogo}>{c.symbol[0]}</span>
                      <span>
                        <strong>{c.name}</strong>
                        <small>
                          {c.symbol} · {c.sector}
                        </small>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                  {!filteredCompanies(companies, search).length && (
                    <p>No matching sample companies.</p>
                  )}
                </div>
              )}
            </div>
            <button
              className={s.iconButton}
              aria-label={dark ? "Use light theme" : "Use dark theme"}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className={s.iconButton}
              aria-label="Open alerts"
              onClick={() => go("Alerts")}
            >
              <Bell size={19} />
            </button>
            <button
              className={s.avatar}
              aria-label="Open account settings"
              onClick={() => go("Settings")}
            >
              A
            </button>
          </header>
        </>
      )}
      <main className={publicPage ? s.publicMain : s.main} tabIndex={-1}>
        {state === "Stale" && (
          <Note>
            Stale-state preview: the last available snapshot remains visible
            with its date. No values on this screen are live.
          </Note>
        )}
        {["Error", "Empty", "Loading", "Restricted"].includes(state) ? (
          <section className={s.statePanel} aria-busy={state === "Loading"}>
            {state === "Restricted" ? <Lock size={28} /> : <Info size={28} />}
            <h1>
              {state === "Error"
                ? "We couldn’t load this view."
                : state === "Empty"
                  ? "A clear place to begin."
                  : state === "Loading"
                    ? "Preparing your workspace…"
                    : "More depth with Pro."}
            </h1>
            <p>
              {state === "Error"
                ? "Your saved work stays intact. Try loading the view again."
                : state === "Empty"
                  ? "Add a company to start building your research universe."
                  : state === "Loading"
                    ? "Loading-state design preview."
                    : "This preview demonstrates a restricted feature state."}
            </p>
            <Button
              onClick={() => {
                setState("Populated");
                if (state === "Restricted") go("Plans");
              }}
            >
              {state === "Error"
                ? "Try again"
                : state === "Empty"
                  ? "Explore companies"
                  : state === "Restricted"
                    ? "View plans"
                    : "Show populated view"}
            </Button>
          </section>
        ) : page === "Company" ? (
          <ResearchView
            key={symbol}
            symbol={symbol}
            onEvidence={() => setEvidence(true)}
            onAlert={() => go("Alerts")}
          />
        ) : (
          <WorkspaceViews
            key={page}
            page={page}
            go={go}
            open={open}
            notify={setToast}
            dark={dark}
            setDark={setDark}
          />
        )}
        <footer className={s.footer}>
          <span>AURYN · A more considered next step.</span>
          <span>Design preview · sample data · no live account connection</span>
        </footer>
      </main>
      {!publicPage && (
        <nav className={s.mobileNav} aria-label="Main navigation">
          {destinations.slice(0, 4).map(([label, Icon]) => (
            <button
              key={label}
              aria-current={
                page === label || (page === "Company" && label === "Research")
                  ? "page"
                  : undefined
              }
              onClick={() => go(label)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
          <button
            onClick={() => go("Settings")}
            aria-current={page === "Settings" ? "page" : undefined}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>
      )}
      {toast && (
        <div className={s.toast} role="status">
          <Check size={18} />
          {toast}
          <button aria-label="Dismiss message" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        className={s.dialog}
        ref={dialog}
        onCancel={() => setEvidence(false)}
      >
        <header>
          <span className={s.eyebrow}>AURYN PACE / EVIDENCE</span>
          <button
            className={s.iconButton}
            aria-label="Close evidence"
            onClick={() => setEvidence(false)}
          >
            <X />
          </button>
        </header>
        <h2>A measured step, explained.</h2>
        <p>
          Pace describes price-based contribution context. It is considered
          alongside the business and your position limits.
        </p>
        {[
          [
            "01",
            "Business qualification",
            "Check growth, profitability and cash generation.",
          ],
          [
            "02",
            "Price conditions",
            "Keep completed-period and forming readings separate.",
          ],
          [
            "03",
            "Position fit",
            "Respect available cash and concentration limits.",
          ],
        ].map(([n, h, p]) => (
          <div className={s.evidenceRow} key={n}>
            <span>{n}</span>
            <div>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          </div>
        ))}
        <Note>
          All readings in this prototype are illustrative. They do not
          demonstrate historical accuracy or recommend a trade.
        </Note>
        <Button onClick={() => setEvidence(false)}>
          Back to research <ArrowRight size={16} />
        </Button>
      </dialog>
    </div>
  );
}
