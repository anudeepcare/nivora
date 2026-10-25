"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  FileText,
  ChartNoAxesCombined,
  Menu,
  X,
} from "lucide-react";
import { authClient } from "@/lib/client";
export function PublicSample() {
  const [active, setActive] = useState("business");
  return (
    <section
      className="research-panorama"
      aria-label="Illustrative research preview — not a real investment"
    >
      <header className="panorama-toolbar">
        <div className="panorama-company">
          <span>E</span>
          <div>
            <strong>Example Company</strong>
            <small>Illustrative · not a real investment</small>
          </div>
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
      </header>
      <h2 className="panorama-title">
        One company. Three perspectives.<span aria-hidden="true">⟶</span>
      </h2>
      <div className="panorama-chapters">
        <section
          id="preview-business"
          className="panorama-business"
          data-active={active === "business"}
        >
          <header>
            <span>01</span>
            <h3>Business</h3>
            <i />
          </header>
          <p>A growing, cash-generative business.</p>
          <div className="panorama-metrics">
            <div>
              <strong>+24%</strong>
              <span>Revenue growth</span>
              <small>3-year CAGR · illustrative</small>
            </div>
            <div>
              <strong>14%</strong>
              <span>Free cash flow margin</span>
              <small>LTM · illustrative</small>
            </div>
          </div>
          <div className="panorama-chart-labels">
            <span>Revenue · USD B</span>
            <span>FCF margin</span>
          </div>
          <svg
            className="panorama-business-chart"
            viewBox="0 0 320 165"
            role="img"
            aria-label="Illustrative revenue rises from 2020 to 2025 alongside a free cash flow margin line"
          >
            {[35, 70, 105, 140].map((y) => (
              <line key={y} x1="15" x2="300" y1={y} y2={y} stroke="#e6edf6" />
            ))}
            {[45, 52, 47, 64, 71, 79, 75, 91, 102, 110, 121, 134].map(
              (h, i) => (
                <rect
                  key={i}
                  x={20 + i * 23}
                  y={148 - h}
                  width="15"
                  height={h}
                  fill={i % 2 ? "#87baff" : "#bedcff"}
                />
              ),
            )}
            <path
              d="M25 132L48 127L71 129L94 113L117 117L140 101L163 104L186 90L209 84L232 74L255 70L278 58"
              fill="none"
              stroke="#059782"
              strokeWidth="2.5"
            />
            {["2020", "2021", "2022", "2023", "2024", "2025"].map((year, i) => (
              <text
                key={year}
                x={20 + i * 52}
                y="163"
                fontSize="9"
                fill="#7a8ba3"
              >
                {year}
              </text>
            ))}
          </svg>
          <footer>
            <span>
              <i />
              Revenue
            </span>
            <span>
              <i />
              Free cash flow margin
            </span>
          </footer>
        </section>
        <section
          id="preview-value"
          className="panorama-value"
          data-active={active === "value"}
        >
          <header>
            <span>02</span>
            <h3>Value</h3>
            <i />
          </header>
          <p>A range of outcomes, grounded in assumptions.</p>
          <div className="panorama-cases">
            {[
              ["Bear", "$80"],
              ["Base", "$110"],
              ["Bull", "$145"],
            ].map(([name, price]) => (
              <div key={name} data-case={name}>
                <span>{name}</span>
                <strong>{price}</strong>
              </div>
            ))}
          </div>
          <svg
            className="panorama-value-chart"
            viewBox="0 0 320 126"
            role="img"
            aria-label="Illustrative scenarios on a shared linear scale: Bear 80, Base 110, Bull 145 and reference price 102"
          >
            <line x1="15" x2="305" y1="38" y2="38" stroke="#c5d1e2" />
            {[
              [80, "#e96b71"],
              [110, "#2468e8"],
              [145, "#009982"],
            ].map(([v, c]) => (
              <circle
                key={v}
                cx={15 + ((Number(v) - 60) / 100) * 290}
                cy="38"
                r="5"
                fill={String(c)}
              />
            ))}
            <line
              x1={15 + (42 / 100) * 290}
              x2={15 + (42 / 100) * 290}
              y1="25"
              y2="52"
              stroke="#182c43"
            />
            <circle cx={15 + (42 / 100) * 290} cy="38" r="5" fill="#182c43" />
            <text
              x={15 + (42 / 100) * 290}
              y="71"
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="#182c43"
            >
              $102
            </text>
            <text
              x={15 + (42 / 100) * 290}
              y="88"
              textAnchor="middle"
              fontSize="9"
              fill="#70829a"
            >
              Reference price
            </text>
            <line x1="15" x2="305" y1="106" y2="106" stroke="#ccd7e6" />
            {[60, 80, 100, 120, 140, 160].map((v, i) => (
              <text
                key={v}
                x={15 + i * 58}
                y="122"
                textAnchor="middle"
                fontSize="9"
                fill="#70829a"
              >
                {v}
              </text>
            ))}
          </svg>
          <small className="panorama-disclosure">
            Scenario assumptions, not predictions.
            <br />
            Illustrative prices, not company valuations.
          </small>
        </section>
        <section
          id="preview-timing"
          className="panorama-timing"
          data-active={active === "timing"}
        >
          <header>
            <span>03</span>
            <h3>Timing</h3>
            <i />
          </header>
          <p>Market conditions, in context.</p>
          <div className="panorama-zones">
            {[
              ["1×", "Baseline"],
              ["2×", "Higher"],
              ["3×", "Higher"],
              ["2×", "Higher"],
            ].map(([multiple, label], i) => (
              <div key={i} data-zone={multiple}>
                <strong>{multiple}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <span className="panorama-timing-label">
            Illustrative monthly contribution conditions
          </span>
          <svg
            className="panorama-timing-chart"
            viewBox="0 0 320 105"
            role="img"
            aria-label="Illustrative monthly condition history"
          >
            <rect x="100" y="10" width="70" height="68" fill="#e9f5f3" />
            <rect x="240" y="10" width="65" height="68" fill="#edf6ff" />
            {[18, 45, 72].map((y) => (
              <line key={y} x1="10" x2="308" y1={y} y2={y} stroke="#e5edf5" />
            ))}
            <path
              d="M10 68L28 70L45 64L63 52L80 55L98 45L115 49L133 37L150 45L168 32L185 37L203 39L220 28L238 32L255 20L273 25L290 20L308 14"
              fill="none"
              stroke="#299ab3"
              strokeWidth="2"
            />
            {["Jan", "Mar", "May", "Jul", "Sep", "Dec"].map((m, i) => (
              <text key={m} x={10 + i * 57} y="99" fontSize="9" fill="#71849b">
                {m}
              </text>
            ))}
          </svg>
          <small className="panorama-disclosure">
            Confirmed and forming, kept separate.
            <br />
            Multipliers are not leverage or return forecasts.
          </small>
        </section>
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
    <main className="public-site">
      <nav className="public-nav" aria-label="Public navigation">
        <Link href="/" className="public-brand">
          <img src="/icon.svg" width="31" height="31" alt="" />
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
            Get started
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
          <Link href="/pricing" className="public-pricing-link">
            Pricing
          </Link>
          <Link href="/login">Sign in</Link>
          <Link href="/login?mode=signup">Create an account</Link>
        </nav>
      )}
      <section
        className={`public-hero ${sampleOnly ? "" : "public-hero-connected"}`}
      >
        <div>
          <h1>
            {sampleOnly ? (
              <>
                One company.
                <br />
                <em>Three perspectives.</em>
              </>
            ) : (
              <>
                See the business.
                <br />
                <em>Understand the price.</em>
              </>
            )}
          </h1>
          <p>
            Understand the business. Put the price in perspective. Know what to
            watch next.
          </p>
          <div className="public-actions">
            <Link href="/sample" className="public-button">
              Explore AURYN <ArrowRight size={17} />
            </Link>
            <Link href="/login?mode=signup" className="public-button secondary">
              Create an account
            </Link>
          </div>
        </div>
        {!sampleOnly && (
          <aside
            className="public-decision-map"
            aria-label="Three connected research perspectives"
          >
            <div>
              <span>01 · BUSINESS</span>
              <h2>Understand what lasts.</h2>
              <p>Cash generation, competitive evidence and funding.</p>
            </div>
            <div>
              <span>02 · VALUE</span>
              <h2>Put price in perspective.</h2>
              <p>Scenarios, assumptions and the room for error.</p>
            </div>
            <div>
              <span>03 · TIMING</span>
              <h2>Know what to watch.</h2>
              <p>Price conditions, risks and the next turning point.</p>
            </div>
          </aside>
        )}
      </section>
      <div className="public-preview">
        <PublicSample />
      </div>
      <section className="public-benefits" id="why-auryn">
        <h2>Research that joins the dots.</h2>
        <div>
          {[
            [
              Search,
              "The evidence",
              "Clear, structured analysis of the business, financials and key drivers.",
            ],
            [
              FileText,
              "The counter-case",
              "Understand what could go wrong, so you can challenge your thesis.",
            ],
            [
              ChartNoAxesCombined,
              "Your next checkpoint",
              "Keep company events and market conditions beside your research.",
            ],
          ].map(([Icon, title, description]) => {
            const I = Icon as typeof Search;
            return (
              <article key={String(title)}>
                <i>
                  <I size={23} />
                </i>
                <div>
                  <h3>{String(title)}</h3>
                  <p>{String(description)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <footer className="public-footer">
        <Link href="/contact">Contact & support</Link>
        <Link href="/" className="public-brand">
          <img src="/icon.svg" width="25" height="25" alt="" />
          <span>AURYN</span>
        </Link>
        <p>Independent research for a more thoughtful market.</p>
        <nav aria-label="Legal and support">
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
