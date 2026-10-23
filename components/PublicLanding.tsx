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
          <a href="/#why-auryn" className="public-method">
            Why AURYN
          </a>
          <Link href="/sample" className="public-method">
            Explore
          </Link>
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
                <i /> Business first. Price in perspective.
              </span>
              <h1>
                Know what you own.
                <br />
                <em>See what matters next.</em>
              </h1>
              <p>
                Understand the business, put its price in context, and follow
                the changes that matter to your investments. One calm workspace,
                with the evidence close by.
              </p>
              <div className="public-actions">
                <Link href="/login?mode=signup" className="public-button">
                  Create your workspace <ArrowUpRight size={18} />
                </Link>
                <Link href="/sample" className="public-secondary">
                  Explore the experience <ArrowRight size={17} />
                </Link>
              </div>
              <ul className="public-hero-capabilities" aria-label="Inside your workspace"><li>Company research</li><li>Valuation & price context</li><li>Your portfolio, connected</li></ul>
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
          <section id="why-auryn" className="public-why" aria-label="Why AURYN">
            <header>
              <span className="public-eyebrow">
                A connected investing workflow
              </span>
              <h2>
                Less searching.
                <br />
                More understanding.
              </h2>
              <p>Start with the answer. Go as deep as you need.</p>
            </header>
            <div className="public-journey">
              {[
                {
                  icon: Layers3,
                  n: "01",
                  title: "Understand the business",
                  text: "Growth, cash generation, dilution and funding—read together, with strengths and risks side by side.",
                  tone: "blue",
                  link: "Business & financials",
                },
                {
                  icon: ChartNoAxesCombined,
                  n: "02",
                  title: "Understand the opportunity",
                  text: "Keep analyst targets, supported valuation scenarios and settled price conditions distinct. See the assumptions behind each.",
                  tone: "teal",
                  link: "Value & technicals",
                },
                {
                  icon: Wallet,
                  n: "03",
                  title: "Stay close to what changes",
                  text: "Follow company news and upcoming reports alongside your holdings. Review concentration without losing the business context.",
                  tone: "violet",
                  link: "Home & portfolio",
                },
              ].map((x) => (
                <article key={x.n} data-tone={x.tone}>
                  <div className="journey-top">
                    <x.icon size={23} />
                    <span>{x.n}</span>
                  </div>
                  <h3>{x.title}</h3>
                  <p>{x.text}</p>
                  <span className="journey-label">{x.link}</span>
                </article>
              ))}
            </div>
          </section>
          <section
            className="public-principles"
            aria-label="Research you can question"
          >
            <div>
              <ShieldCheck size={24} />
              <h2>
                Confidence in the process.
                <br />
                Room for uncertainty.
              </h2>
              <p>
                Company evidence, analyst opinion and model assumptions have
                different jobs. AURYN keeps them separate so you can judge the
                case for yourself.
              </p>
              <Link href="/methodology" className="public-secondary">
                How AURYN works <ArrowRight size={17} />
              </Link>
            </div>
            <ul>
              <li>
                <Check size={18} />
                <span>
                  <b>The case and the counter-case.</b> Read the strongest
                  evidence on both sides.
                </span>
              </li>
              <li>
                <Check size={18} />
                <span>
                  <b>Dates alongside the numbers.</b> Know when a quote or
                  financial observation was recorded.
                </span>
              </li>
              <li>
                <Check size={18} />
                <span>
                  <b>Depth when you need it.</b> Choose Simple or Pro, with
                  light, dark and saved appearance preferences.
                </span>
              </li>
            </ul>
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
                "No demonstrated advantage is claimed. Cycle-relative monthly rules are documented, with hypothetical equal-budget comparisons and explicit limitations.",
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
              Your research.
              <br />A clearer perspective.
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
