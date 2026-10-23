"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  ShieldCheck,
  ChartNoAxesCombined,
  Layers3,
  Wallet,
  Check,
} from "lucide-react";
import { authClient } from "@/lib/client";
export function PublicSample() {
  const [tab, setTab] = useState("Business");
  return (
    <section
      className="public-sample"
      aria-label="Interactive illustrative research example"
    >
      <header>
        <div className="sample-identity">
          <span>E</span>
          <div>
            <strong>Example Company</strong>
            <small>Illustrative walkthrough · not a real investment</small>
          </div>
        </div>
        <span className="sample-status">See how it works</span>
      </header>
      <div
        className="sample-tabs"
        role="tablist"
        aria-label="Example research sections"
        onKeyDown={(e) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
            return;
          e.preventDefault();
          const tabs = ["Business", "Value", "Discipline"],
            i = tabs.indexOf(tab),
            next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? 2
                  : (i + (e.key === "ArrowRight" ? 1 : -1) + 3) % 3;
          setTab(tabs[next]);
          (
            e.currentTarget.querySelectorAll("button")[
              next
            ] as HTMLButtonElement
          ).focus();
        }}
      >
        {["Business", "Value", "Discipline"].map((t) => (
          <button
            key={t}
            role="tab"
            tabIndex={tab === t ? 0 : -1}
            aria-selected={tab === t}
            aria-controls="sample-panel"
            id={`sample-${t}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div id="sample-panel" role="tabpanel" aria-labelledby={`sample-${tab}`}>
        {tab === "Business" ? (
          <>
            <div className="sample-answer">
              <span className="sample-kicker">The business</span>
              <h3>Growth matters more when it becomes cash.</h3>
              <p>
                Read revenue, operating margins and cash conversion
                together—then check the funding risks.
              </p>
            </div>
            <div className="sample-metrics">
              <div>
                <span>Revenue growth</span>
                <strong>+24%</strong>
                <small>Illustrative year-over-year</small>
                <svg viewBox="0 0 180 55" aria-hidden="true">
                  {[22, 28, 31, 40, 48, 53].map((h, i) => (
                    <rect
                      key={i}
                      x={i * 30 + 3}
                      y={55 - h}
                      width="19"
                      height={h}
                      rx="3"
                    />
                  ))}
                </svg>
              </div>
              <div>
                <span>Free cash flow margin</span>
                <strong>14%</strong>
                <small>Illustrative cash generation</small>
                <svg viewBox="0 0 180 55" aria-hidden="true">
                  <path d="M2 49 L30 45 L60 47 L90 33 L120 29 L150 14 L178 7" />
                </svg>
              </div>
            </div>
            <div className="sample-evidence">
              <Check size={17} />
              <span>
                Next question: does cash growth keep pace with dilution?
              </span>
            </div>
          </>
        ) : tab === "Value" ? (
          <>
            <div className="sample-answer">
              <span className="sample-kicker">The price</span>
              <h3>A range with assumptions. Not one magic number.</h3>
              <p>
                Separate conditional scenarios from analyst targets. Inspect
                growth, profitability and share-count assumptions.
              </p>
            </div>
            <div className="sample-cases">
              {[
                ["Bear", "$80", "Slower growth"],
                ["Base", "$110", "Central assumptions"],
                ["Bull", "$140", "Stronger execution"],
              ].map(([n, v, d]) => (
                <div key={n}>
                  <span>{n}</span>
                  <strong>{v}</strong>
                  <small>{d}</small>
                </div>
              ))}
            </div>
            <p className="sample-caption">
              These numbers explain the interface only. They are not calculated
              company valuations.
            </p>
            <div className="sample-evidence">
              <Layers3 size={17} />
              <span>
                Open the evidence to see the model, horizon and inputs.
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="sample-answer">
              <span className="sample-kicker">The discipline</span>
              <h3>Price conditions alongside the business case.</h3>
              <p>
                Distinguish a completed monthly signal from one still forming. A
                larger multiplier never means a guaranteed gain.
              </p>
            </div>
            <div className="sample-discipline">
              <strong>2×</strong>
              <div>
                <b>Example contribution condition</b>
                <span>Twice your usual contribution—not leverage.</span>
              </div>
            </div>
            <div className="sample-zone-track">
              {["1×", "1×", "2×", "3×", "2×", "1×"].map((v, i) => (
                <div key={i} data-zone={v}>
                  <span>{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}</span>
                  <b>{v}</b>
                </div>
              ))}
            </div>
            <p className="sample-caption">
              Illustrative history. Real signals require eligible settled data
              and remain experimental.
            </p>
          </>
        )}
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
  useEffect(() => {
    if (sampleOnly) return;
    let active = true;
    try {
      authClient()
        .auth.getSession()
        .then(({ data }) => {
          if (active && data.session) router.replace("/overview");
        })
        .catch(() => {});
    } catch {}
    return () => {
      active = false;
    };
  }, [router, sampleOnly]);
  return (
    <main className="public-site">
      <nav className="public-nav" aria-label="Public navigation">
        <Link href="/" className="public-brand">
          <img src="/icon-192.png" width="36" height="36" alt="" />
          <span>AURYN</span>
        </Link>
        <div>
          <a href="/#why-auryn" className="public-method">Why AURYN</a>
          <Link href="/login">Sign in</Link>
          <Link href="/login?mode=signup" className="public-button compact">
            Get started <ArrowUpRight size={15} />
          </Link>
        </div>
      </nav>
      {sampleOnly ? (
        <section className="public-walkthrough">
          <span className="public-eyebrow">Try the experience</span>
          <h1>
            Three questions.
            <br />
            One connected view.
          </h1>
          <p>
            Tap Business, Value and Discipline. This walkthrough uses fictional
            examples; your account research uses the available company evidence.
          </p>
          <PublicSample />
          <Link href="/login?mode=signup" className="public-button">
            Create your workspace <ArrowRight size={17} />
          </Link>
        </section>
      ) : (
        <>
          <section className="public-hero">
            <div className="public-hero-copy">
              <span className="public-eyebrow">
                <i /> An investment research workspace
              </span>
              <h1>
                See the business.
                <br />
                <em>Understand the price.</em>
                <br />
                Invest with perspective.
              </h1>
              <p>
                Company quality, valuation scenarios and monthly price
                conditions—connected to the investments you actually hold.
              </p>
              <div className="public-actions">
                <Link href="/login?mode=signup" className="public-button">
                  Create your workspace <ArrowUpRight size={18} />
                </Link>
                <Link href="/sample" className="public-secondary">
                  Explore the experience <ArrowRight size={17} />
                </Link>
              </div>
              <div className="public-assurance">
                <ShieldCheck size={16} />
                <span>Evidence you can inspect. No promised returns.</span>
              </div>
            </div>
            <div className="public-hero-example">
              <div className="public-example-label">
                <span>Inside AURYN</span>
                <span>Tap to explore ↓</span>
              </div>
              <PublicSample />
            </div>
          </section>
          <section
            className="public-value-strip"
            aria-label="Connected research"
          >
            <span>Business quality</span>
            <i>↗</i>
            <span>Valuation context</span>
            <i>↗</i>
            <span>Monthly discipline</span>
            <i>↗</i>
            <span>Portfolio perspective</span>
          </section>
          <section id="why-auryn" className="public-why" aria-label="Why AURYN">
            <div><span className="public-eyebrow">Why AURYN</span><h2>A stronger process.<br/>A clearer perspective.</h2><p>Your research should connect the quality of a business, the price you pay and the risks you already hold.</p></div>
            <ol><li><span>BUSINESS FIRST</span><h3>Look beyond the ticker.</h3><p>Follow revenue into profit and cash. See financing and dilution alongside growth, with comparable reported periods.</p></li><li><span>PRICE SECOND</span><h3>Know what each number means.</h3><p>Analyst targets, conditional scenarios and price-based accumulation zones are different tools. AURYN keeps their assumptions and dates separate.</p></li><li><span>YOUR PERSPECTIVE</span><h3>Keep the important things close.</h3><p>Your holdings, concentration, news and upcoming reports belong in the same research workflow. Choose Simple or Pro depth and your preferred appearance.</p></li></ol>
          </section>
          <section className="public-features">
            <header>
              <span className="public-eyebrow">
                Less noise. More understanding.
              </span>
              <h2>
                Your next decision deserves
                <br />
                more than a price chart.
              </h2>
              <p>
                Start with a clear assessment. Follow the evidence when you want
                to go deeper.
              </p>
            </header>
            <div className="public-feature-grid">
              {[
                {
                  icon: Layers3,
                  n: "01",
                  title: "Understand what you own",
                  text: "Read growth, margins, cash generation and financing risks together. Use the right lens for the business.",
                },
                {
                  icon: ChartNoAxesCombined,
                  n: "02",
                  title: "Put the price in context",
                  text: "Compare supported scenarios, inspect assumptions and keep analyst consensus separate from modelled value.",
                },
                {
                  icon: ShieldCheck,
                  n: "03",
                  title: "Give discipline a structure",
                  text: "Explore confirmed monthly conditions, provisional changes and transparent historical policy comparisons.",
                },
                {
                  icon: Wallet,
                  n: "04",
                  title: "See your portfolio clearly",
                  text: "Review concentration, upcoming earnings and sector context. Keep assets, managed balances and margin debt distinct.",
                },
              ].map((x) => (
                <article key={x.n}>
                  <div>
                    <x.icon size={23} />
                    <span>{x.n}</span>
                  </div>
                  <h3>{x.title}</h3>
                  <p>{x.text}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="public-process">
            <div>
              <span className="public-eyebrow">
                The answer, then the evidence
              </span>
              <h2>
                Simple enough to start.
                <br />
                Deep enough to question.
              </h2>
              <p>
                AURYN separates business strength, valuation and price
                conditions. Missing evidence stays visible. An
                attractive-looking chart doesn’t establish a strong company.
              </p>
              <Link href="/methodology" className="public-secondary">
                Read the methodology <ArrowUpRight size={16} />
              </Link>
            </div>
            <ol>
              <li>
                <span>01</span>
                <div>
                  <h3>See the assessment</h3>
                  <p>What the available evidence supports—and the main risk.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <h3>Understand the reason</h3>
                  <p>Read the supporting case and the counter-case together.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <h3>Inspect the evidence</h3>
                  <p>
                    Open dated inputs, model assumptions and calculation
                    details.
                  </p>
                </div>
              </li>
            </ol>
          </section>
          <section className="public-faq">
            <h2>Before you begin.</h2>
            {[
              [
                "Does AURYN place trades?",
                "The research workspace does not place trades for you. Experimental trading tools remain separate from the main experience.",
              ],
              [
                "Are the prices always live?",
                "Availability depends on instrument coverage and your data connection. Quotes carry observation times; older or missing observations remain labelled.",
              ],
              [
                "Are the accumulation models proven to outperform?",
                "No demonstrated advantage is claimed. Trend-adjusted monthly rules are documented, with hypothetical equal-budget comparisons and explicit limitations.",
              ],
              [
                "Can I use it on my phone?",
                "AURYN is designed for mobile and desktop, with a home-screen PWA experience and saved display preferences.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
          <section className="public-final">
            <span className="public-eyebrow">
              Business first. Price second. Timing alongside.
            </span>
            <h2>
              Make room for
              <br />
              better questions.
            </h2>
            <Link href="/login?mode=signup" className="public-button">
              Create your workspace <ArrowUpRight size={18} />
            </Link>
          </section>
        </>
      )}
      <footer className="public-footer">
        <Link href="/" className="public-brand">
          <img src="/icon-192.png" width="30" height="30" alt="" />
          <span>AURYN</span>
        </Link>
        <p>
          Research and decision support. Investing involves risk, including loss
          of principal.
        </p>
        <nav aria-label="Legal and support">
          <Link href="/help">Help</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/risk">Risks</Link>
        </nav>
        <small>© {new Date().getFullYear()} AURYN. All rights reserved.</small>
      </footer>
    </main>
  );
}
