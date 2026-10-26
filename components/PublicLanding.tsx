"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  ChartNoAxesCombined,
  Menu,
  X,
  Check,
  ShieldCheck,
  Layers3,
  Scale,
  PieChart,
} from "lucide-react";
import { authClient } from "@/lib/client";

/** An explicitly illustrative product surface; never mixed with account research. */
export function PublicSample({ compact = false }: { compact?: boolean } = {}) {
  const [active, setActive] = useState("business");
  if (compact)
    return (
      <section
        className="mp-auth-preview"
        aria-label="Illustrative product preview — Understand the whole case."
      >
        <div className="mp-mini-head">
          <span className="mp-auth-preview-title">
            Your research, connected
          </span>
          <span className="mp-small-pill">Overview</span>
        </div>
        <div className="mp-auth-case">
          <span>THE INVESTMENT CASE</span>
          <h3>
            Understand the opportunity.
            <br />
            <em>Keep the risks in view.</em>
          </h3>
        </div>
        <div className="mp-evidence mp-evidence-compact">
          <div className="mp-mini-head">
            <strong>Evidence balance</strong>
            <span>Illustrative signals</span>
          </div>
          <div
            className="mp-balance"
            role="img"
            aria-label="Illustrative evidence: 7 supportive, 3 mixed and 2 cautionary signals"
          >
            <i />
            <i />
            <i />
          </div>
          <div className="mp-evidence-key">
            <span>
              <b className="mp-dot mp-dot-green" />
              Supportive <strong>7</strong>
            </span>
            <span>
              <b className="mp-dot mp-dot-amber" />
              Mixed <strong>3</strong>
            </span>
            <span>
              <b className="mp-dot mp-dot-red" />
              Caution <strong>2</strong>
            </span>
          </div>
        </div>
        <div className="mp-auth-preview-metrics">
          <div>
            <span>Business</span>
            <strong>Resilient</strong>
            <i />
          </div>
          <div>
            <span>Valuation</span>
            <strong>In context</strong>
            <i />
          </div>
          <div>
            <span>Portfolio</span>
            <strong>Connected</strong>
            <i />
          </div>
        </div>
      </section>
    );
  return (
    <section
      className="research-panorama"
      aria-label="Illustrative research preview — not a real investment"
    >
      <header className="panorama-toolbar">
        <div className="panorama-company">
          <span>A</span>
          <div>
            <strong>Your next investment</strong>
            <small>Illustrative research · sample values</small>
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
function PublicBrand() {
  return (
    <Link className="mp-brand" href="/" aria-label="Auryn home">
      <span className="mp-brand-mark" aria-hidden="true">
        <img src="/icon.svg" alt="" width="34" height="36" />
      </span>
      <span>AURYN</span>
    </Link>
  );
}
function IllustrativeChart() {
  return (
    <svg
      className="mp-chart"
      viewBox="0 0 460 150"
      fill="none"
      role="img"
      aria-label="Illustrative price path, not a real investment"
    >
      <path
        d="M0 34h460M0 79h460M0 124h460"
        stroke="var(--line)"
        strokeDasharray="3 5"
      />
      <path
        d="M0 128 28 120 50 127 75 105 98 111 120 96 145 101 167 76 191 82 215 67 238 76 260 53 286 64 308 42 331 48 354 31 380 39 409 18 434 24 460 10v140H0Z"
        fill="var(--blue)"
        fillOpacity=".065"
      />
      <path
        d="m0 128 28-8 22 7 25-22 23 6 22-15 25 5 22-25 24 6 24-15 23 9 22-23 26 11 22-22 23 6 23-17 26 8 29-21 25 6 26-14"
        stroke="var(--blue)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IllustrativeEvidence({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mp-evidence ${compact ? "mp-evidence-compact" : ""}`}>
      <div className="mp-mini-head">
        <strong>Evidence balance</strong>
        <span>12 illustrative signals</span>
      </div>
      <div
        className="mp-balance"
        role="img"
        aria-label="Illustrative evidence: 7 supportive, 3 mixed and 2 cautionary signals"
      >
        <i />
        <i />
        <i />
      </div>
      <div className="mp-evidence-key">
        <span>
          <b className="mp-dot mp-dot-green" />
          Supportive <strong>7</strong>
        </span>
        <span>
          <b className="mp-dot mp-dot-amber" />
          Mixed <strong>3</strong>
        </span>
        <span>
          <b className="mp-dot mp-dot-red" />
          Caution <strong>2</strong>
        </span>
      </div>
    </div>
  );
}
function PublicPreview() {
  return (
    <section
      className="mp-product-preview"
      aria-label="Illustrative research preview — not a real investment"
    >
      <div className="mp-preview-top">
        <span className="mp-preview-icon">
          <Layers3 className="mp-icon" />
        </span>
        <span>
          <strong>Your research, connected</strong>
          <small>Decision overview</small>
        </span>
        <span className="mp-live-label">Illustrative</span>
      </div>
      <div className="mp-preview-body">
        <div className="mp-company">
          <span className="mp-company-monogram">N</span>
          <div>
            <strong>Northstar Labs</strong>
            <span>Illustrative company · Technology</span>
          </div>
          <span className="mp-watch-icon" aria-hidden="true">
            ☆
          </span>
        </div>
        <div className="mp-preview-price">
          <strong>$124.80</strong>
          <span>
            +2.4% <small>example day</small>
          </span>
        </div>
        <IllustrativeChart />
        <div className="mp-chart-labels">
          <span>JAN</span>
          <span>MAR</span>
          <span>MAY</span>
          <span>JUL</span>
          <span>SEP</span>
        </div>
        <div className="mp-preview-case">
          <span className="mp-case-label">THE CASE IN ONE SENTENCE</span>
          <p>Improving fundamentals, with expectations worth watching.</p>
          <Link href="/sample">
            Explore the evidence <ArrowRight />
          </Link>
        </div>
        <IllustrativeEvidence compact />
      </div>
      <div className="mp-preview-bottom">
        <span className="mp-mini-check">
          <Check />
        </span>
        <span>Business. Valuation. Risk. One clear view.</span>
      </div>
      <div className="mp-accumulation">
        <span className="mp-accumulation-icon">
          <ChartNoAxesCombined className="mp-icon" />
        </span>
        <div>
          <span>Selected example</span>
          <strong>4× accumulation</strong>
          <small>Illustrative contribution · not a predicted return</small>
        </div>
      </div>
    </section>
  );
}
export default function PublicLanding({
  sampleOnly = false,
}: {
  sampleOnly?: boolean;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
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
    <main className={`mp-public ${sampleOnly ? "mp-sample-page" : ""}`}>
      <header className="mp-header">
        <div className="mp-header-inner">
          <PublicBrand />
          <nav className="mp-nav" aria-label="Main navigation">
            <Link href="/sample">Explore the product</Link>
            <Link href="/pricing">Plans</Link>
            <Link href="/help">Help</Link>
          </nav>
          <div className="mp-header-actions">
            <Link className="mp-login-link" href="/login">
              Sign in
            </Link>
            <Link
              className="mp-button mp-button-primary mp-button-small"
              href="/login?mode=signup"
            >
              Get started <ArrowRight />
            </Link>
            <button
              type="button"
              className="mp-menu-button"
              aria-label={menu ? "Close navigation" : "Open navigation"}
              aria-expanded={menu}
              aria-controls="mp-mobile-navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            id="mp-mobile-navigation"
            className="mp-mobile-navigation"
            aria-label="More public navigation"
          >
            <Link href="/sample">Explore the product</Link>
            <Link href="/pricing">Plans</Link>
            <Link href="/help">Help</Link>
          </nav>
        )}
      </header>
      <section className="mp-hero mp-wrap">
        <div className="mp-hero-copy">
          <div className="mp-overline">
            <span />
            RESEARCH WITH PERSPECTIVE
          </div>
          <h1>
            {sampleOnly ? (
              <>
                One company.
                <br />
                The whole <em>picture.</em>
              </>
            ) : (
              <>
                A clearer view.
                <br />A more considered
                <br />
                <em>decision.</em>
              </>
            )}
          </h1>
          <p>
            See the business, weigh the evidence, and understand the risk. Auryn
            connects your investment research in one thoughtful workspace.
          </p>
          <div className="mp-hero-actions">
            <Link
              className="mp-button mp-button-primary"
              href="/login?mode=signup"
            >
              Start with clarity <ArrowRight />
            </Link>
            <Link
              className="mp-button mp-button-secondary"
              href={sampleOnly ? "#sample-research" : "/sample"}
            >
              Explore the preview
            </Link>
          </div>
          <div className="mp-hero-note">
            <Check className="mp-icon" />
            <span>From the first question to the full picture.</span>
          </div>
        </div>
        <div className="mp-hero-visual">
          <PublicPreview />
        </div>
      </section>
      <div className="mp-preview-disclaimer mp-wrap">
        <span className="mp-preview-disclaimer-dot" />
        Illustrative product preview · fictional company and data
      </div>
      {sampleOnly && (
        <section
          className="mp-wrap mp-sample-detail"
          id="sample-research"
          aria-label="Explore illustrative research"
        >
          <PublicSample />
        </section>
      )}
      <section
        className="mp-principles mp-wrap"
        id="why-auryn"
        aria-label="Our approach"
      >
        <div>
          <Layers3 className="mp-icon" />
          <span>Connected research</span>
        </div>
        <div>
          <Scale className="mp-icon" />
          <span>Evidence you can weigh</span>
        </div>
        <div>
          <PieChart className="mp-icon" />
          <span>Risk in context</span>
        </div>
      </section>
      <section className="mp-feature mp-wrap">
        <div className="mp-feature-copy">
          <span className="mp-overline">01 / UNDERSTAND THE CASE</span>
          <h2>
            Less searching.
            <br />
            More understanding.
          </h2>
          <p>
            Start with the story that matters. A connected research page brings
            the company, its financial health, and its valuation into focus.
          </p>
          <Link className="mp-text-link" href="/sample">
            Explore a research page <ArrowRight />
          </Link>
        </div>
        <div className="mp-feature-card mp-research-visual">
          <div className="mp-mini-head">
            <span className="mp-soft-icon">
              <Search className="mp-icon" />
            </span>
            <span className="mp-small-pill">Research overview</span>
          </div>
          <p className="mp-case-text">
            A durable business.
            <br />
            <span>A price that deserves context.</span>
          </p>
          <div className="mp-research-rows">
            {[
              [
                Layers3,
                "Understand the business",
                "Revenue, customers, and competitive position",
              ],
              [
                ChartNoAxesCombined,
                "Look beneath the numbers",
                "Growth, margins, and financial resilience",
              ],
              [
                Scale,
                "Put the valuation in context",
                "Scenarios, assumptions, and expectations",
              ],
            ].map(([Icon, title, description]) => {
              const I = Icon as typeof Search;
              return (
                <Link
                  href="/sample"
                  className="mp-research-row"
                  key={String(title)}
                >
                  <span className="mp-row-icon">
                    <I className="mp-icon" />
                  </span>
                  <span>
                    <strong>{String(title)}</strong>
                    <small>{String(description)}</small>
                  </span>
                  <ArrowRight />
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <section className="mp-feature mp-feature-reverse mp-wrap">
        <div className="mp-feature-copy">
          <span className="mp-overline">02 / WEIGH THE EVIDENCE</span>
          <h2>
            Every conviction
            <br />
            needs a counterpoint.
          </h2>
          <p>
            See what supports a case and what could challenge it. Explore the
            evidence behind each signal, then decide what matters to you.
          </p>
          <Link className="mp-text-link" href="/sample">
            See both sides <ArrowRight />
          </Link>
        </div>
        <div className="mp-feature-card mp-evidence-visual">
          <IllustrativeEvidence />
          <div className="mp-evidence-row">
            <span className="mp-evidence-tag mp-positive">
              Supports the case
            </span>
            <strong>Cash generation is improving</strong>
            <p>More of the business’s earnings are turning into cash.</p>
          </div>
          <div className="mp-evidence-row">
            <span className="mp-evidence-tag mp-caution">Worth watching</span>
            <strong>Expectations leave less room for error</strong>
            <p>A higher valuation makes future execution matter more.</p>
          </div>
          <div className="mp-evidence-footer">
            Illustrative research signals{" "}
            <Link href="/sample">
              View the full context <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
      <section className="mp-feature mp-wrap">
        <div className="mp-feature-copy">
          <span className="mp-overline">03 / SEE THE BIGGER PICTURE</span>
          <h2>
            Your holdings.
            <br />A connected picture.
          </h2>
          <p>
            Understand how your ideas fit together. See performance,
            concentration, and shared exposures across your portfolio.
          </p>
          <Link className="mp-text-link" href="/portfolio">
            Explore the portfolio <ArrowRight />
          </Link>
        </div>
        <div className="mp-feature-card mp-portfolio-visual">
          <div className="mp-mini-head">
            <strong>Portfolio perspective</strong>
            <span>Illustrative portfolio</span>
          </div>
          <div className="mp-portfolio-summary">
            <div>
              <span>Portfolio value</span>
              <strong>
                $48,620<span>.00</span>
              </strong>
            </div>
            <span className="mp-positive mp-portfolio-change">
              +8.6% <small>example period</small>
            </span>
          </div>
          <IllustrativeChart />
          <div className="mp-risk">
            <span className="mp-risk-title">Shared exposure</span>
            {[
              ["Technology", 62],
              ["Consumer", 24],
              ["Other", 14],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
                <strong>{value}%</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mp-bottom-cta mp-wrap">
        <div className="mp-cta-symbol">
          <Layers3 />
        </div>
        <span className="mp-overline">YOUR NEXT QUESTION STARTS HERE</span>
        <h2>Make room for a clearer view.</h2>
        <p>Bring your research, watchlist, and portfolio together.</p>
        <Link className="mp-button mp-button-primary" href="/login?mode=signup">
          Get started with Auryn <ArrowRight />
        </Link>
        <Link className="mp-cta-plans" href="/pricing">
          Find the plan that fits you
        </Link>
      </section>
      <footer className="mp-footer">
        <div className="mp-footer-top">
          <div>
            <PublicBrand />
            <p>
              More perspective.
              <br />
              More considered decisions.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/sample">Explore Auryn</Link>
            <Link href="/pricing">Plans</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/help">Help</Link>
            <Link href="/login">Sign in</Link>
          </nav>
        </div>
        <div className="mp-footer-bottom">
          <span>© {new Date().getFullYear()} Auryn</span>
          <nav aria-label="Legal and methodology">
            <Link href="/methodology">Methodology</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/risk">Risks</Link>
          </nav>
          <p>
            Examples are fictional. Research supports your judgment; investing
            involves risk.
          </p>
        </div>
      </footer>
    </main>
  );
}
