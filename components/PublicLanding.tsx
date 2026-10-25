"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  FileText,
  ChartNoAxesCombined,
  Menu,
  X,
  Check,
  ShieldCheck,
} from "lucide-react";
import { authClient } from "@/lib/client";

/** An explicitly illustrative product surface; never mixed with account research. */
export function PublicSample() {
  const [active, setActive] = useState("business");
  return (
    <section
      className="research-panorama"
      aria-label="Illustrative research preview — not a real investment"
    >
      <header className="panorama-toolbar">
        <div className="panorama-company">
          <span>A</span>
          <div>
            <strong>
              Atlas Software <small>ATLS</small>
            </strong>
            <small>Illustrative company · not a real investment</small>
          </div>
        </div>
        <div className="panorama-reference">
          <strong>$120.00</strong>
          <span>Illustrative reference price</span>
        </div>
      </header>
      <div className="panorama-verdict">
        <span>AURYN VIEW</span>
        <h2>Understand the whole case.</h2>
        <p>Business evidence, price assumptions and timing—side by side.</p>
      </div>
      <div
        className="panorama-navigation"
        role="group"
        aria-label="Preview perspective"
      >
        {["business", "value", "timing"].map((key) => (
          <button
            type="button"
            key={key}
            aria-pressed={active === key}
            aria-controls={`preview-${key}`}
            onClick={() => setActive(key)}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>
      <div className="panorama-chapters">
        <section
          id="preview-business"
          className="panorama-business"
          data-active={active === "business"}
        >
          <header>
            <span>1</span>
            <h3>Business improving</h3>
          </header>
          <p>Growth supported by cash generation.</p>
          <div className="panorama-metrics">
            <div>
              <strong>+18%</strong>
              <span>Revenue growth</span>
            </div>
            <div>
              <strong>24%</strong>
              <span>FCF margin</span>
            </div>
          </div>
          <svg
            viewBox="0 0 260 110"
            role="img"
            aria-label="Illustrative annual revenue increases from 2 to 4 billion over four years"
            className="panorama-business-chart"
          >
            <line x1="12" x2="248" y1="88" y2="88" stroke="#d6e5ec" />
            {[42, 55, 72, 88].map((h, i) => (
              <g key={i}>
                <rect
                  x={24 + i * 58}
                  y={88 - h}
                  width="30"
                  height={h}
                  rx="4"
                  fill={i === 3 ? "#0b9b77" : "#96c2ff"}
                />
                <text
                  x={39 + i * 58}
                  y="106"
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64728c"
                >
                  {2021 + i}
                </text>
              </g>
            ))}
          </svg>
        </section>
        <section
          id="preview-value"
          className="panorama-value"
          data-active={active === "value"}
        >
          <header>
            <span>2</span>
            <h3>Price in perspective</h3>
          </header>
          <p>Assumptions, not a single promise.</p>
          <div className="panorama-cases">
            {[
              ["Bear", "$90"],
              ["Base", "$132"],
              ["Bull", "$168"],
            ].map(([name, price]) => (
              <div key={name} data-case={name}>
                <span>{name}</span>
                <strong>{price}</strong>
              </div>
            ))}
          </div>
          <svg
            viewBox="0 0 280 110"
            role="img"
            aria-label="Illustrative shared linear scale from Bear 90 to Bull 168, with reference 120 and Base 132"
            className="panorama-value-chart"
          >
            <line
              x1="20"
              x2="260"
              y1="34"
              y2="34"
              stroke="#b7d8ee"
              strokeWidth="4"
            />
            {[
              [90, "#ed6878"],
              [132, "#1763ff"],
              [168, "#069a75"],
            ].map(([v, c]) => (
              <circle
                key={v}
                cx={20 + ((Number(v) - 90) / 78) * 240}
                cy="34"
                r="6"
                fill={String(c)}
              />
            ))}
            <line
              x1={20 + (30 / 78) * 240}
              x2={20 + (30 / 78) * 240}
              y1="20"
              y2="50"
              stroke="#26304b"
              strokeWidth="2"
            />
            <text
              x={20 + (30 / 78) * 240}
              y="70"
              textAnchor="middle"
              fontSize="12"
              fill="#26304b"
            >
              $120
            </text>
            <text
              x={20 + (30 / 78) * 240}
              y="88"
              textAnchor="middle"
              fontSize="10"
              fill="#64728c"
            >
              Reference
            </text>
          </svg>
        </section>
        <section
          id="preview-timing"
          className="panorama-timing"
          data-active={active === "timing"}
        >
          <header>
            <span>3</span>
            <h3>Timing mixed</h3>
          </header>
          <p>Price conditions alongside the business.</p>
          <div className="panorama-pace">
            <div>
              <strong>2×</strong>
              <span>Completed month</span>
            </div>
            <div>
              <strong>3×</strong>
              <span>Developing · not final</span>
            </div>
          </div>
          <svg
            className="panorama-timing-chart"
            viewBox="0 0 260 90"
            role="img"
            aria-label="Illustrative price trend with changing momentum"
          >
            <path
              d="M8 65L25 59L40 65L56 43L72 48L87 30L103 39L119 32L135 40L152 23L168 27L184 15L201 22L218 17L236 25L252 19"
              fill="none"
              stroke="#8056d9"
              strokeWidth="2.5"
            />
            <line x1="8" x2="252" y1="76" y2="76" stroke="#e4dff1" />
          </svg>
        </section>
      </div>
      <footer className="panorama-disclosure">
        <ShieldCheck size={13} />
        <span>
          Illustrative preview. Scenarios are assumptions; Pace multiples are
          contributions, not predicted returns.
        </span>
      </footer>
    </section>
  );
}
export default function PublicLanding({
  sampleOnly = false,
}: {
  sampleOnly?: boolean;
}) {
  const router = useRouter(),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    if (sampleOnly) return;
    let alive = true;
    try {
      authClient()
        .auth.getSession()
        .then(({ data }) => {
          if (alive && data.session) router.replace("/overview");
        })
        .catch(() => {});
    } catch {}
    return () => {
      alive = false;
    };
  }, [router, sampleOnly]);
  return (
    <main
      className={`public-site atlas-public ${sampleOnly ? "public-sample-page" : ""}`}
    >
      <nav className="public-nav" aria-label="Public navigation">
        <Link href="/" className="public-brand">
          <img src="/icon.svg" width="32" height="32" alt="" />
          <span>AURYN</span>
        </Link>
        <div className="public-desktop-links">
          <a href="/#why-auryn">Why AURYN</a>
          <Link href="/sample">The experience</Link>
        </div>
        <div className="public-nav-actions">
          <Link href="/pricing" className="public-pricing-link">
            Pricing
          </Link>
          <Link href="/login">Sign in</Link>
          <Link href="/login?mode=signup" className="public-button compact">
            Get started <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            className="public-menu-button"
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      {menu && (
        <nav className="public-mobile-menu" aria-label="More public navigation">
          <a href="/#why-auryn" onClick={() => setMenu(false)}>
            Why AURYN
          </a>
          <Link href="/sample">The experience</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login?mode=signup">Create an account</Link>
        </nav>
      )}
      <section className="public-hero">
        <div className="public-hero-copy">
          <span className="public-eyebrow">YOUR INVESTMENT PERSPECTIVE</span>
          <h1>
            {sampleOnly ? (
              <>
                One company.
                <br />
                <em>The whole picture.</em>
              </>
            ) : (
              <>
                Understand the business.
                <br />
                <em>Put price in perspective.</em>
              </>
            )}
          </h1>
          <p>
            See what supports the case, what could go wrong and what would
            change the view. Clear research for a decision you understand.
          </p>
          <div className="public-actions">
            <Link href="/login?mode=signup" className="public-button">
              Create an account <ArrowRight size={17} />
            </Link>
            <Link href="/sample" className="public-button secondary">
              Explore sample
            </Link>
          </div>
          <div className="public-trust">
            <span>
              <Check size={14} />
              Start free
            </span>
            <span>
              <Check size={14} />
              No card required
            </span>
            <span>
              <Check size={14} />
              Your research, your decision
            </span>
          </div>
          <Link className="public-plan-note" href="/pricing">
            Free research for 100 companies / month. Explore Pro →
          </Link>
        </div>
        <div className="public-hero-preview">
          <div className="public-preview-label">
            <span />
            <span />
            <span />
            <strong>AURYN · Research workspace</strong>
          </div>
          <PublicSample />
        </div>
      </section>
      <section className="public-benefits" id="why-auryn">
        <div className="public-section-heading">
          <span className="public-eyebrow">ONE CONNECTED PERSPECTIVE</span>
          <h2>
            Less noise.
            <br />
            More understanding.
          </h2>
          <p>
            Move from the business to its price, then follow the evidence that
            matters.
          </p>
        </div>
        <div>
          {[
            [
              Search,
              "Understand the business",
              "Cash generation, growth, funding and competitive evidence. Know what supports the case.",
            ],
            [
              FileText,
              "Challenge the price",
              "Bear, base and bull assumptions alongside analyst expectations. See where the conclusions differ.",
            ],
            [
              ChartNoAxesCombined,
              "Know what to watch",
              "Price conditions, company news and upcoming events. Keep your next checkpoint in view.",
            ],
          ].map(([Icon, title, description], i) => {
            const I = Icon as typeof Search;
            return (
              <article key={String(title)}>
                <i>
                  <I size={22} />
                </i>
                <span className="public-step">0{i + 1}</span>
                <h3>{String(title)}</h3>
                <p>{String(description)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="public-closing">
        <div>
          <span className="public-eyebrow">BUILT FOR YOUR OWN THINKING</span>
          <h2>A clearer view starts here.</h2>
          <p>
            Research the company. Understand the assumptions. Make your own
            call.
          </p>
        </div>
        <Link href="/login?mode=signup" className="public-button">
          Start your research <ArrowRight size={17} />
        </Link>
      </section>
      <footer className="public-footer">
        <Link href="/" className="public-brand">
          <img src="/icon.svg" width="25" height="25" alt="" />
          <span>AURYN</span>
        </Link>
        <p>Business. Price. Perspective.</p>
        <nav aria-label="Legal and support">
          <Link href="/contact">Contact</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/help">Help</Link>
        </nav>
        <small>
          © {new Date().getFullYear()} AURYN. All rights reserved. Research and
          decision support; investing involves risk. Preview figures are
          illustrative, not investment recommendations.
        </small>
      </footer>
    </main>
  );
}
