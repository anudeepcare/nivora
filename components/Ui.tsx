"use client";
import { useId, useRef, useState, useEffect } from "react";
import { CircleHelp, X, ArrowUpRight, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
export function Logo() {
  return (
    <span className="brand">
      <svg viewBox="0 0 36 38" width="31" height="33" aria-hidden="true">
        <path fill="#356df3" d="M14 3h9L10 34H1z" />
        <path fill="#80a8ff" d="m23 3 12 31H23L12 7z" />
        <path fill="#2458d9" d="m18 21 5 13H10z" />
      </svg>
      <span>
        <strong>AURYN</strong>
        <small>Investment Intelligence</small>
      </span>
    </span>
  );
}
const logos: Record<string, string> = {
  AAPL: "AAPL.svg",
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
  useEffect(() => setFailed(false), [symbol]);
  return (
    <span
      className="security-logo"
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
      ) : symbol === "BTC/USD" || symbol === "BTC" ? (
        <span className="bitcoin">₿</span>
      ) : logos[symbol] && !failed ? (
        <img
          alt=""
          src={`/logos/${logos[symbol]}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <b>{symbol.slice(0, 2)}</b>
      )}
    </span>
  );
}
export function Help({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    id = useId();
  return (
    <>
      <button
        className="help"
        type="button"
        aria-label={`About ${label}`}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <CircleHelp size={14} />
      </button>
      <dialog
        className="dialog help-dialog"
        ref={dialog}
        aria-labelledby={id}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
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
      </dialog>
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
      {children}
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
