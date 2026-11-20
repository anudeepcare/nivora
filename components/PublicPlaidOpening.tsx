"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Layers3,
  TrendingUp,
  Scale,
  FileSearch,
  Filter,
  Columns2,
} from "lucide-react";
import s from "./PublicPlaidOpening.module.css";
const groups = [
  {
    name: "Research",
    links: [
      ["Atlas", "Price and valuation", "/overview", Layers3],
      ["Pace", "Accumulation conditions", "/#pace-public", TrendingUp],
      ["Scenarios", "Bear, base and bull", "/#how-it-works", Scale],
      ["Evidence", "What supports the view", "/#how-it-works", FileSearch],
      ["Screener", "Find companies to research", "/options", Filter],
      ["Compare", "See stocks side by side", "/compare", Columns2],
    ],
  },
  {
    name: "Portfolio",
    links: [
      ["Your holdings", "Positions and exposure", "/portfolio", Layers3],
      ["Comparison", "Review account history", "/portfolio", Columns2],
      ["Your watchlist", "Keep companies in view", "/watchlist", FileSearch],
    ],
  },
  {
    name: "Markets",
    links: [
      ["Screener", "Explore available filters", "/options", Filter],
      ["Market radar", "Dated market context", "/overview", TrendingUp],
      ["Events", "Company checkpoints", "/overview#home-earnings", FileSearch],
    ],
  },
] as const;
function Contours() {
  return (
    <svg
      className={s.contours}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="public-contour" x2="1" y2="1">
          <stop stopColor="#9e9aff" />
          <stop offset="1" stopColor="#72dae1" />
        </linearGradient>
      </defs>
      {Array.from({ length: 28 }, (_, i) => (
        <path
          key={i}
          d={`M ${-170 + i * 28} -30 C ${280 + i * 12} 170, ${40 + i * 23} 360, ${570 + i * 15} 430 S ${700 + i * 21} 750, ${1250 + i * 12} 810`}
          fill="none"
          stroke="url(#public-contour)"
          strokeOpacity=".24"
          strokeWidth="1"
        />
      ))}
    </svg>
  );
}
function PaceMethodDial() {
  const shades = ["#d2c7ee", "#b9c7fa", "#a5cdfa", "#9bdceb", "#8ee6db"];
  const polar = (radius: number, degrees: number) => {
    const a = (degrees * Math.PI) / 180;
    return [180 + radius * Math.cos(a), 151 + radius * Math.sin(a)];
  };
  return (
    <svg
      className={s.paceDial}
      viewBox="0 0 360 264"
      role="img"
      aria-label="Pace stages P0 through P4, no stock selected"
    >
      <circle className={s.dialFace} cx="180" cy="151" r="93" />
      {shades.map((color, index) => {
        const start = 142 + index * 54;
        const [x1, y1] = polar(117, start);
        const [x2, y2] = polar(117, start + 43);
        const [tx, ty] = polar(117, start + 21.5);
        return (
          <g key={color}>
            <path
              d={`M ${x1} ${y1} A 117 117 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={color}
              strokeWidth="29"
              strokeLinecap="round"
            />
            <text x={tx} y={ty + 5} textAnchor="middle" className={s.dialStage}>
              P{index}
            </text>
          </g>
        );
      })}
      <text x="180" y="147" textAnchor="middle" className={s.dialWord}>
        Pace
      </text>
      <text x="180" y="173" textAnchor="middle" className={s.dialCaption}>
        FIVE PRICE ZONES
      </text>
    </svg>
  );
}
function MethodPreview({ kind }: { kind: string }) {
  return (
    <div className={s.preview}>
      <small>Method preview · not live data</small>
      {kind === "Atlas" ? (
        <>
          <strong>What does the price assume?</strong>
          <div className={s.range}>
            {["Bear", "Base", "Bull"].map((label) => (
              <span key={label}>
                <i />
                {label}
              </span>
            ))}
          </div>
          <p>Growth + margins + valuation</p>
        </>
      ) : kind === "Pace" ? (
        <>
          <PaceMethodDial />
          <p>Pause → watch → accumulate</p>
          <small>Conditions, not a stock recommendation</small>
        </>
      ) : kind === "Portfolio" ? (
        <>
          <strong>Your account, in context</strong>
          <div className={s.compare}>
            {["Portfolio", "S&P 500", "Nasdaq 100"].map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
          <p>Compare only when dated history is available.</p>
        </>
      ) : kind === "Radar" ? (
        <>
          <strong>What deserves a closer look?</strong>
          {["Price conditions", "Business evidence", "Upcoming events"].map(
            (v) => (
              <div className={s.row} key={v}>
                <span>{v}</span>
                <ArrowRight size={16} />
              </div>
            ),
          )}
        </>
      ) : (
        <>
          <strong>Start with your criteria</strong>
          <div className={s.filters}>
            {["Sector", "Market cap", "Valuation"].map((v) => (
              <span key={v}>
                {v}
                <ChevronDown size={13} />
              </span>
            ))}
          </div>
          <p>Filter available records. Inspect the evidence.</p>
        </>
      )}
    </div>
  );
}
export default function PublicPlaidOpening({
  brand,
  themeControl,
}: {
  brand: ReactNode;
  themeControl: ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [category, setCategory] = useState(0);
  const container = useRef<HTMLElement>(null),
    trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <>
      <div className={s.opening}>
        <Contours />
        <header
          className={s.header}
          ref={container}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              trigger.current?.focus();
            }
          }}
          onBlur={(event) => {
            if (
              event.relatedTarget &&
              !event.currentTarget.contains(event.relatedTarget as Node)
            )
              setOpen(false);
          }}
        >
          <div className={s.nav}>
            <div className={s.brand}>{brand}</div>
            <button
              ref={trigger}
              type="button"
              className={s.explore}
              aria-expanded={open}
              aria-controls="public-explore"
              onClick={() => setOpen(!open)}
            >
              Explore <ChevronDown size={17} />
            </button>
            <nav className={s.direct} aria-label="Public navigation">
              <Link href="/methodology">Methodology</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/help">Help</Link>
            </nav>
            <div className={s.navActions}>
              {themeControl}
              <Link href="/login">Sign in</Link>
              <Link className={s.demo} href="/sample">
                Try the demo
              </Link>
            </div>
          </div>
          {open && (
            <div id="public-explore" className={s.mega}>
              <div
                className={s.categories}
                role="group"
                aria-label="Explore categories"
              >
                {groups.map((g, index) => (
                  <button
                    type="button"
                    key={g.name}
                    aria-pressed={category === index}
                    onClick={() => setCategory(index)}
                  >
                    {g.name}
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>
              <nav
                className={s.links}
                aria-label={`${groups[category].name} destinations`}
              >
                {groups[category].links.map(([title, detail, href, Icon]) => (
                  <Link href={href} key={title} onClick={() => setOpen(false)}>
                    <span className={s.icon}>
                      <Icon size={25} />
                    </span>
                    <span>
                      <strong>{title}</strong>
                      <small>{detail}</small>
                    </span>
                  </Link>
                ))}
              </nav>
              <Link
                className={s.featured}
                href="/sample"
                onClick={() => setOpen(false)}
              >
                <strong>See Atlas in action</strong>
                <MethodPreview kind="Atlas" />
                <span>
                  Open the product guide <ArrowRight size={20} />
                </span>
              </Link>
              <nav
                className={s.mobileLinks}
                aria-label="More public navigation"
              >
                <Link href="/methodology" onClick={() => setOpen(false)}>
                  Methodology
                </Link>
                <Link href="/pricing" onClick={() => setOpen(false)}>
                  Pricing
                </Link>
                <Link href="/help" onClick={() => setOpen(false)}>
                  Help
                </Link>
                <Link href="/#use-cases" onClick={() => setOpen(false)}>
                  Use cases
                </Link>
              </nav>
            </div>
          )}
        </header>
        <section
          id="ap-main"
          aria-labelledby="ap-hero-heading"
          className={s.hero}
        >
          <div>
            <span className={s.eyebrow}>
              A CLEARER PERSPECTIVE ON INVESTING
            </span>
            <h1 id="ap-hero-heading">
              Know what
              <br />
              <em>you own.</em>
            </h1>
            <p>
              See the business behind the price.
              <br />
              Connect evidence, expectations and your next decision.
            </p>
            <Link href="/sample" className={s.heroCta}>
              Explore the demo <ArrowRight size={21} />
            </Link>
            <small>A product walkthrough. No invented live market data.</small>
          </div>
          <div className={s.heroArt} aria-hidden="true">
            <div className={s.orbit} />
            <div className={s.orbitInner} />
            <div className={s.artCore}>
              <Layers3 size={64} />
              <strong>
                Evidence.
                <br />
                Perspective.
                <br />
                Conviction.
              </strong>
            </div>
            <span className={s.artLabel}>THE BUSINESS</span>
            <span className={s.artLabelTwo}>THE EXPECTATIONS</span>
          </div>
        </section>
      </div>
      <section
        className={s.productSection}
        id="product"
        aria-labelledby="public-products"
      >
        <span className={s.eyebrow}>ONE CONNECTED WORKSPACE</span>
        <h2 id="public-products">See what moves a stock.</h2>
        <div className={s.productGrid}>
          {[
            ["Decision Atlas", "Atlas", "/overview"],
            ["Auryn Pace", "Pace", "/#pace-public"],
            ["Portfolio", "Portfolio", "/portfolio"],
            ["Market Radar", "Radar", "/overview"],
            ["Screener", "Screener", "/options"],
          ].map(([title, kind, href]) => (
            <Link className={s.productCard} href={href} key={title}>
              <header>
                <h3>{title}</h3>
                <ArrowRight size={23} />
              </header>
              <MethodPreview kind={kind} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
