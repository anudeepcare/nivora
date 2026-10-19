"use client";
import Link from "next/link";
import { useId, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CircleHelp, X, ArrowUpRight, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requestLogo } from "@/lib/logo-client";
import { dateLabel, quoteTime } from "@/lib/format";
export function DataStamp({
  source,
  asOf,
  status,
}: {
  source?: string | null;
  asOf?: string | null;
  status?: string;
}) {
  return (
    <span className="data-stamp">
      <span>
        {status ? `${status} · ` : ""}
        {asOf?.includes('T') ? quoteTime(asOf) : dateLabel(asOf)}
        {source && /fallback/i.test(source) && <small> · Backup data used</small>}
      </span>
    </span>
  );
}
export function Logo() {
  return (
    <span className="brand">
      <img src="/icon.svg" width="31" height="34" alt="" aria-hidden="true" />
      <span>
        <strong>AURYN</strong>
        <small>Investment Intelligence</small>
      </span>
    </span>
  );
}
const logos: Record<string, string> = {
  AAPL: "AAPL.svg",
  NOW: "NOW.png",
  SAP: "SAP.png",
  MSFT: "",
  IREN: "IREN.svg",
  APP: "APP.svg",
  ASTS: "ASTS.png",
  NVDA: "NVDA.svg",
  AMZN: "AMZN.png",
  GOOGL: "GOOGL.svg",
  META: "META.svg",
  HIMS: "HIMS.png",
  CIFR: "CIFR.png",
  CRWV: "CRWV.png",
  TSLA: "TSLA.svg",
  SOFI: "SOFI.png",
  SHOP: "SHOP.svg",
  AMD: "AMD.svg",
  ADBE: "ADBE.png",
  PLTR: "PLTR.png",
  CRM: "CRM.png",
  NBIS: "NBIS.svg",
  MU: "MU.png",
  SPOT: "SPOT.svg",
  NFLX: "NFLX.svg",
  "DOGE/USD": "DOGE.svg",
  "SOL/USD": "SOL.svg",
  "XRP/USD": "XRP.svg",
  GOOG: "GOOGL.svg",
};
export function SecurityLogo({
  symbol,
  size = 42,
}: {
  symbol: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const [remote, setRemote] = useState<{
    symbol: string;
    url: string | null;
  } | null>(null);
  useEffect(() => {
    let active = true;
    setFailed(false);
    setRemote(null);
    if (!logos[symbol] && !["MSFT", "BTC/USD", "ETH/USD"].includes(symbol))
      void requestLogo(symbol).then((url) => {
        if (active) setRemote({ symbol, url });
      });
    return () => {
      active = false;
    };
  }, [symbol]);
  const imageSrc = logos[symbol]
    ? `/logos/${logos[symbol]}`
    : remote?.symbol === symbol
      ? remote.url
      : null;
  return (
    <span
      className={`security-logo ${["HIMS", "NOW"].includes(symbol) ? "logo-dark" : ""}`}
      style={{ width: size, height: size, minWidth: size }}
      aria-hidden="true"
    >
      {symbol === "MSFT" ? (
        <svg viewBox="0 0 24 24" width="27">
          <path fill="#f25022" d="M1 1h10v10H1z" />
          <path fill="#7fba00" d="M13 1h10v10H13z" />
          <path fill="#00a4ef" d="M1 13h10v10H1z" />
          <path fill="#ffb900" d="M13 13h10v10H13z" />
        </svg>
      ) : symbol === "BTC/USD" ? (
        <span className="bitcoin">₿</span>
      ) : symbol === "ETH/USD" ? (
        <svg viewBox="0 0 32 48" width="22" aria-hidden="true">
          <path fill="#627eea" d="M16 0 1 25l15 9 15-9z" />
          <path fill="#3c3c3d" d="m16 0 15 25-15-7z" />
          <path fill="#8c8c8c" d="m1 28 15 20 15-20-15 9z" />
        </svg>
      ) : imageSrc && !failed ? (
        <img
          alt=""
          src={imageSrc}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <b className="ticker-monogram" title={symbol}>
          {symbol.split("/")[0]}
        </b>
      )}
    </span>
  );
}
export function Help({
  label,
  children,
  trigger,
}: {
  label: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    id = useId(),
    [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  return (
    <>
      <button
        className={trigger ? "text-button help-trigger" : "help"}
        type="button"
        aria-label={`About ${label}`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {trigger ?? <CircleHelp size={14} />}
      </button>
      {open &&
        createPortal(
          <dialog
            className="dialog help-dialog"
            ref={dialog}
            aria-labelledby={id}
            onClose={() => setOpen(false)}
            onClick={(e) => {
              if (e.target !== e.currentTarget) return;
              const bounds = e.currentTarget.getBoundingClientRect();
              if (
                e.clientX < bounds.left ||
                e.clientX > bounds.right ||
                e.clientY < bounds.top ||
                e.clientY > bounds.bottom
              )
                e.currentTarget.close();
            }}
          >
            <button
              className="icon-button close"
              aria-label="Close explanation"
              onClick={() => dialog.current?.close()}
            >
              <X size={20} />
            </button>
            <span className="eyebrow">UNDERSTAND THE METRIC</span>
            <h2 id={id}>{label}</h2>
            <div className="help-copy">{children}</div>
            <button
              className="button primary"
              onClick={() => dialog.current?.close()}
            >
              Got it
            </button>
          </dialog>,
          document.body,
        )}
    </>
  );
}
export function Empty({
  title,
  children,
  icon: Icon = Search,
  action,
}: {
  title: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
export function Source({
  href,
  children,
}: {
  href?: string | null;
  children: React.ReactNode;
}) {
  return href && /^https:\/\//.test(href) ? (
    <a className="source" href={href} target="_blank" rel="noreferrer">
      {/eodhd\.com\/financial-apis|twelvedata\.com\/docs/.test(href)
        ? "Data methodology"
        : children}
      <ArrowUpRight size={13} />
    </a>
  ) : (
    <span className="muted small">{children}</span>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

export function ProductFooter() {
  return (
    <footer className="product-footer">
      <span>© {new Date().getFullYear()} AURYN. All rights reserved.</span>
      <nav aria-label="Help and legal"><Link href="/help">Help</Link><Link href="/methodology">Methodology</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/risk">Risk disclosure</Link><Link href="/reliability">Data reliability</Link></nav>
      <Help label="Research disclosure" trigger="Research disclosure">
        <p>
          AURYN provides investment research and decision support. It does not
          provide personalised financial advice.
        </p>
        <p>
          Scenarios, signals and hypothetical results are not guarantees of
          future returns. Investing involves risk, including loss of principal.
        </p>
        <p>
          Check observation dates and underlying assumptions before acting.
          Market prices may be delayed; incomplete evidence is shown as
          unavailable.
        </p>
      </Help>
    </footer>
  );
}
