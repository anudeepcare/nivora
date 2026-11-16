"use client";
import { ContextLink } from "./ContextLink";
import dynamic from "next/dynamic";
// The illustrative Pace tab does not need the stock classifiers until opened.
const PaceInstrument = dynamic(() => import("./PaceInstrument"), {
  loading: () => <p role="status">Opening the Pace guide…</p>,
});
import landing from "./PublicLanding.module.css";
import { PrivacyChoices } from "./AnalyticsConsent";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Menu,
  X,
  Check,
  ShieldCheck,
  Layers3,
  Scale,
} from "lucide-react";
import { authClient } from "@/lib/client";
import { PACE_LEVELS } from "@/lib/pace-presentation";

function PublicBrand() {
  return (
    <Link className="ap-brand" href="/" aria-label="AURYN home">
      <img src="/icon.svg" alt="" width="34" height="34" />
      <span>AURYN</span>
    </Link>
  );
}

/** A guide to real product concepts, with no fictional company observations. */
export function PublicSample({ compact = false }: { compact?: boolean } = {}) {
  const [lens, setLens] = useState(0);
  const lenses = [
    {
      name: "Business",
      icon: Layers3,
      title: "Follow the money.",
      text: "Read revenue, margins and cash generation together. See the dated evidence behind the business case.",
      points: [
        "Growth over time",
        "Cash after capital spending",
        "Debt & funding needs",
      ],
    },
    {
      name: "Value",
      icon: Scale,
      title: "See what the price assumes.",
      text: "Compare bear, base and bull scenarios. Open the assumptions and keep analyst expectations separate.",
      points: [
        "Bear · slower growth",
        "Base · current assumptions",
        "Bull · stronger growth",
      ],
    },
    {
      name: "Pace",
      icon: ChartNoAxesCombined,
      title: "Give your next addition context.",
      text: "P means Pace. Monthly price zones guide gradual contributions only when the business qualifies.",
      points: [
        "P0 · Pause additions",
        "P1 · Watch or hold",
        "P2–P4 · Build within your limits",
      ],
    },
  ];
  return (
    <section
      className={`${landing.guide} ap-product signal-public-demo ${compact ? "ap-product-compact" : ""}`}
      aria-label="Illustrative product guide, not a live investment recommendation"
    >
      <header className="signal-demo-header">
        <span>
          <Layers3 size={18} /> Research, connected
        </span>
        <small>Illustrative product guide</small>
      </header>
      <div
        className="signal-demo-tabs"
        role="tablist"
        aria-label="Explore AURYN"
      >
        {lenses.map((item, index) => (
          <button
            key={item.name}
            role="tab"
            id={`guide-tab-${compact ? "compact" : "full"}-${index}`}
            aria-controls={`guide-panel-${compact ? "compact" : "full"}-${index}`}
            tabIndex={lens === index ? 0 : -1}
            onKeyDown={(event) => {
              const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
              if (!keys.includes(event.key)) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 2
                    : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
              setLens(next);
              const tabs =
                event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                  '[role="tab"]',
                );
              tabs?.[next]?.focus();
            }}
            aria-selected={lens === index}
            onClick={() => setLens(index)}
          >
            <item.icon size={17} />
            {item.name}
          </button>
        ))}
      </div>
      {lenses.map((selected, index) => (
        <div
          key={selected.name}
          hidden={lens !== index}
          className={`signal-demo-content lens-${index}`}
          role="tabpanel"
          id={`guide-panel-${compact ? "compact" : "full"}-${index}`}
          aria-labelledby={`guide-tab-${compact ? "compact" : "full"}-${index}`}
        >
          <span className="signal-demo-number">
            0{index + 1} / THE RESEARCH LENS
          </span>
          <h2>{selected.title}</h2>
          <p>{selected.text}</p>
          <div className="signal-demo-evidence">
            {selected.points.map((point, index) => (
              <div key={point}>
                <span>0{index + 1}</span>
                <strong>{point}</strong>
                <Check size={17} />
              </div>
            ))}
          </div>
          {index === 2 && (
            <p className="signal-demo-note">
              AURYN Accumulation Pace: P0 Pause · P1 Watch · P2 Initial · P3
              Deeper · P4 Deep. Previous month closing zone · history. Current
              month · forming. Price zones, not predicted returns. Risk and
              business checks still apply.
            </p>
          )}
        </div>
      ))}
      <footer className="signal-demo-footer">
        <ShieldCheck size={16} /> Evidence first. Your judgment always.
      </footer>
    </section>
  );
}

/** A product walkthrough: no company, quote or return is presented as live. */
export function InvestmentDemo() {
  const [step, setStep] = useState(0);
  const steps = ["Discover", "Understand", "Plan"];
  return (
    <section
      className={landing.demo}
      id="investment-demo"
      aria-label="Interactive product walkthrough"
    >
      <header className={landing.demoHeader}>
        <span>
          <img src="/icon.svg" width="22" height="22" alt="" /> AURYN{" "}
          <small>/ RESEARCH WORKSPACE</small>
        </span>
        <span className={landing.sampleBadge}>Product walkthrough</span>
      </header>
      <div
        className={landing.demoTabs}
        role="tablist"
        aria-label="Investment research journey"
      >
        {steps.map((name, index) => (
          <button
            key={name}
            type="button"
            role="tab"
            id={`journey-tab-${index}`}
            aria-controls={`journey-panel-${index}`}
            aria-selected={step === index}
            tabIndex={step === index ? 0 : -1}
            onClick={() => setStep(index)}
            onKeyDown={(event) => {
              if (
                !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 2
                    : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
              setStep(next);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
                [next]?.focus();
            }}
          >
            <span>0{index + 1}</span>
            {name}
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        className={landing.demoBody}
        role="tabpanel"
        id={`journey-panel-${step}`}
        aria-labelledby={`journey-tab-${step}`}
        tabIndex={0}
      >
        <div className={landing.demoIntro}>
          <span className={landing.eyebrow}>
            {steps[step]} / SAMPLE RESEARCH
          </span>
          <h2>
            {
              [
                "Start with the business.",
                "A good business. At what price?",
                "A plan before your next purchase.",
              ][step]
            }
          </h2>
          <p>
            {
              [
                "Start with business strength. Then ask what needs to be true.",
                "Keep the business case and the price you pay in perspective.",
                "Explore the five Pace stages. Business and risk checks come first.",
              ][step]
            }
          </p>
        </div>
        {step === 0 && (
          <div className={landing.businessPreview}>
            <div className={landing.chartHeading}>
              <span>
                <span className={landing.companyMark}>
                  <Layers3 size={17} />
                </span>
                <strong>
                  Your investment case
                  <small>Research framework · illustrative guide</small>
                </strong>
              </span>
              <span className={landing.review}>Business lens</span>
            </div>
            <div className={landing.operatingChart}>
              <div className={landing.chartLegend}>
                <span>Revenue</span>
                <span>Cash generation</span>
                <small>SCHEMATIC · NOT MARKET DATA</small>
              </div>
              <svg
                viewBox="0 0 480 155"
                role="img"
                aria-label="Schematic interface showing separate revenue and cash generation trends, without actual financial data"
              >
                <defs>
                  <linearGradient
                    id="public-chart-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#5088ff" stopOpacity=".23" />
                    <stop offset="100%" stopColor="#5088ff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g
                  stroke="currentColor"
                  strokeOpacity=".09"
                  strokeDasharray="3 5"
                >
                  <path d="M12 30H468M12 65H468M12 100H468M12 135H468" />
                  <path d="M70 12V142M155 12V142M240 12V142M325 12V142M410 12V142" />
                </g>
                <path
                  d="M12 108C40 108 44 88 70 91S126 66 155 77S204 106 240 84S295 48 325 59S378 82 410 48S449 46 468 28V150H12Z"
                  fill="url(#public-chart-fill)"
                />
                <path
                  d="M12 108C40 108 44 88 70 91S126 66 155 77S204 106 240 84S295 48 325 59S378 82 410 48S449 46 468 28"
                  fill="none"
                  stroke="#5088ff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M12 129C47 129 46 116 70 119S124 105 155 112S205 87 240 101S289 119 325 97S378 75 410 89S451 75 468 70"
                  fill="none"
                  stroke="#cf9654"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="468"
                  cy="28"
                  r="5"
                  fill="#5088ff"
                  stroke="#f5f2eb"
                  strokeWidth="4"
                />
                <circle cx="468" cy="70" r="4" fill="#cf9654" />
              </svg>
              <div className={landing.chartAxis}>
                <span>Operating evidence over time</span>
                <span>
                  Sources & dates in research <ArrowRight size={11} />
                </span>
              </div>
            </div>
            <div className={landing.evidenceMetrics}>
              <div>
                <Layers3 size={16} />
                <small>BUSINESS</small>
                <strong>Growth & quality</strong>
                <span>Follow the revenue</span>
              </div>
              <div>
                <ChartNoAxesCombined size={16} />
                <small>CASH</small>
                <strong>What remains</strong>
                <span>After capital spending</span>
              </div>
              <div>
                <ShieldCheck size={16} />
                <small>RESILIENCE</small>
                <strong>Test the risks</strong>
                <span>Debt & funding needs</span>
              </div>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className={landing.scenarios}>
            {[
              ["Bear", "Slower growth", "Pressure on margins"],
              ["Base", "Current assumptions", "Test against evidence"],
              ["Bull", "Stronger growth", "Execution must deliver"],
            ].map(([name, title, note]) => (
              <article key={name}>
                <span>{name}</span>
                <div className={landing.scenarioBar} aria-hidden="true" />
                <strong>{title}</strong>
                <small>{note}</small>
              </article>
            ))}
            <p>
              Illustrative scenarios, not price targets. In research, inspect
              the available sources, dates and assumptions before relying on an
              assessment.
            </p>
          </div>
        )}
        {step === 2 && (
          <div className={landing.pacePreview}>
            <PaceInstrument publicGuide compact />
          </div>
        )}
      </div>
      <footer className={landing.demoFooter}>
        <ShieldCheck size={15} />
        <span>Illustrative guide · no live recommendation</span>
        <button type="button" onClick={() => setStep((step + 1) % 3)}>
          {step === 2 ? "Back to Discover" : `Next: ${steps[step + 1]}`}
          <ArrowRight size={14} />
        </button>
      </footer>
    </section>
  );
}

function ProductWalkthrough() {
  return (
    <section
      className="ap-walkthrough ap-container"
      id="product-guide"
      aria-labelledby="ap-guide-heading"
    >
      <div className="ap-section-heading">
        <span className="ap-eyebrow">A CLOSER LOOK</span>
        <h2 id="ap-guide-heading">Follow the thinking.</h2>
        <p>
          Open each part of the research process. This guide explains the
          product; it does not recommend a stock.
        </p>
      </div>
      <div className="ap-guide-sections">
        <details open>
          <summary>
            <span>01</span>
            <strong>The decision and its reasons</strong>
            <ArrowRight size={18} aria-hidden="true" />
          </summary>
          <div>
            <p>
              Start with a clear view of the company. See the reasons that
              support an action, the risks that could challenge it, and what
              would change the assessment.
            </p>
            <p>
              Incomplete assessments show Review and explain the missing check.
              A falling price alone does not make a company good or bad.
            </p>
          </div>
        </details>
        <details>
          <summary>
            <span>02</span>
            <strong>The price and its assumptions</strong>
            <ArrowRight size={18} aria-hidden="true" />
          </summary>
          <div>
            <p>
              Look at the business behind the stock: growth, cash generation,
              financial health and valuation. Where the evidence supports
              scenarios, inspect the assumptions behind them.
            </p>
            <p>
              Sources and observation dates help you judge the context.
              Scenarios are possibilities, not promises.
            </p>
          </div>
        </details>
        <details>
          <summary>
            <span>03</span>
            <strong>Your AURYN Accumulation Pace</strong>
            <ArrowRight size={18} aria-hidden="true" />
          </summary>
          <div>
            <p>
              Pace uses monthly price conditions to identify accumulation zones
              from P0 to P4. P means Pace. A confirmed reading uses completed
              months; the current month is shown separately while it is forming.
            </p>
            <p>
              P1 means Watch or Hold. Once the business qualifies, P2 starts
              small, P3 builds gradually and P4 supports deeper planned
              accumulation within your budget. P0 pauses additions; it does not
              mean Sell. Valuation remains a separate check.
            </p>
            <Link href="/methodology">
              Read the methodology <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </details>
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
    const tags = Array.from(
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'),
    );
    const previous = tags.map((tag) => tag.content);
    tags.forEach((tag) => {
      tag.content = "#fafbf9";
    });
    return () =>
      tags.forEach((tag, index) => {
        tag.content = previous[index];
      });
  }, []);
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
      className={`mp-public ap-public ${landing.page} ${sampleOnly ? "ap-sample-page" : ""}`}
    >
      <a className="ap-skip-link" href="#ap-main">
        Skip to content
      </a>
      <div className="ap-opening">
        <header
          className={`ap-header ${landing.header}`}
          onKeyDown={(event) => {
            if (event.key === "Escape" && menu) {
              event.preventDefault();
              event.currentTarget
                .querySelector<HTMLButtonElement>(
                  '[aria-controls="ap-mobile-navigation"]',
                )
                ?.focus();
              setMenu(false);
            }
          }}
        >
          <div className="ap-header-inner ap-container">
            <PublicBrand />
            <nav className="ap-nav" aria-label="Main navigation">
              <Link href="/#how-it-works">Product</Link>
              <Link href="/sample">Product guide</Link>
              <Link href="/pricing">Pricing</Link>
            </nav>
            <div className="ap-header-actions">
              <Link className="ap-signin" href="/login">
                Sign in
              </Link>
              <Link
                className="ap-button ap-button-primary ap-header-cta"
                href="/login?mode=signup"
              >
                Get started <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <button
                className="ap-menu-button"
                type="button"
                aria-label={menu ? "Close navigation" : "Open navigation"}
                aria-expanded={menu}
                aria-controls="ap-mobile-navigation"
                onClick={() => setMenu(!menu)}
              >
                {menu ? (
                  <X size={20} aria-hidden="true" />
                ) : (
                  <Menu size={20} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
          {menu && (
            <nav
              id="ap-mobile-navigation"
              className="ap-mobile-navigation"
              aria-label="More public navigation"
            >
              <Link href="/#how-it-works" onClick={() => setMenu(false)}>
                How it works
              </Link>
              <Link href="/pricing" onClick={() => setMenu(false)}>
                Pricing
              </Link>
              <Link href="/sample" onClick={() => setMenu(false)}>
                Product guide
              </Link>
              <Link href="/login" onClick={() => setMenu(false)}>
                Sign in
              </Link>
              <Link href="/login?mode=signup" onClick={() => setMenu(false)}>
                Get started
              </Link>
              <Link href="/help" onClick={() => setMenu(false)}>
                Help
              </Link>
            </nav>
          )}
        </header>
        <section
          className={landing.hero}
          id="ap-main"
          aria-labelledby="ap-hero-heading"
        >
          <div className={landing.heroCopy}>
            <span className={landing.eyebrow}>INVESTMENT WORKSPACE</span>
            <h1 id="ap-hero-heading">
              Research.
              <br />
              Decide.
              <br />
              Review.
            </h1>
            <div className={landing.heroDetail}>
              <p>
                One place to connect the business, the price and your portfolio.
              </p>
              <div className={landing.actions}>
                <Link className={landing.primary} href="/login?mode=signup">
                  Open your workspace <ArrowRight size={17} />
                </Link>
                <Link className={landing.secondary} href="/research/NOW">
                  See the NOW research page
                </Link>
              </div>
            </div>
          </div>
          <div className={landing.heroVisual}>
            <section
              className={landing.pacePreview}
              aria-label="Illustrative Pace zone chart"
            >
              <header>
                <h2>Price through the Pace zones</h2>
                <p>
                  Deeper blue = deeper accumulation zone · illustrative guide,
                  not market data
                </p>
              </header>
              <svg
                viewBox="0 0 660 360"
                role="img"
                aria-label="Schematic price path across four blue Pace zones. No company prices or forecast are shown."
              >
                <rect width="660" height="360" rx="12" fill="#d3e6f8" />
                <path d="M0 230H660V270H0Z" fill="#a4caec" />
                <path d="M0 270H660V310H0Z" fill="#5e9dde" />
                <path d="M0 310H660V360H0Z" fill="#245fb8" />
                <path
                  d="M20 80L40 58L62 100L86 87L110 160L135 145L160 228L180 198L205 274L230 245L260 280L285 220L310 195L335 210L360 178L385 140L410 155L440 100L465 132L490 95L515 118L540 75L560 105L580 240L610 256L640 234"
                  fill="none"
                  stroke="#17243b"
                  strokeWidth="2.5"
                />
                <g fontSize="12" fontFamily="inherit" fontWeight="600">
                  <text x="16" y="215" fill="#17243b">
                    P1 · Watch / hold
                  </text>
                  <text x="16" y="254" fill="#17243b">
                    P2 · Start small
                  </text>
                  <text x="16" y="295" fill="#17243b">
                    P3 · Build gradually
                  </text>
                  <text x="16" y="340" fill="white">
                    P4 · Deep accumulation
                  </text>
                </g>
              </svg>
              <footer>
                No live quote or recommendation.{" "}
                <Link href="/research/NOW">Open dated company evidence →</Link>
              </footer>
            </section>
          </div>
        </section>
      </div>

      <section
        className={`${landing.paceRibbon} ap-container`}
        id="how-it-works"
        aria-label="AURYN Pace guide"
      >
        <h2>AURYN PACE · ONE READING PER COMPANY</h2>
        <div>
          {PACE_LEVELS.map((label, i) => (
            <Link href="/pace" key={label} data-level={i}>
              <small>P{i}</small>
              <strong>{label}</strong>
            </Link>
          ))}
        </div>
        <p>A filter match is a research lead, not a recommendation.</p>
      </section>
      <nav
        className={`${landing.destinationGrid} ap-container`}
        aria-label="Workspace destinations"
      >
        {[
          [
            "/discover",
            "01 · DISCOVER",
            "Find your next question",
            "Explore companies, then follow the evidence behind an idea.",
          ],
          [
            "/watchlist",
            "02 · FOLLOW",
            "Keep ideas in view",
            "Save companies and return to their prices, reports and changing context.",
          ],
          [
            "/portfolio",
            "03 · REVIEW",
            "See your whole portfolio",
            "Bring holdings, cash and concentration into the same conversation.",
          ],
          [
            "/help",
            "04 · UNDERSTAND",
            "Make the most of Auryn",
            "A practical guide to Pace, scenarios and the evidence behind them.",
          ],
        ].map(([href, kicker, title, detail]) => (
          <Link href={href} key={href}>
            <small>{kicker}</small>
            <h2>
              {title} <ArrowRight size={18} />
            </h2>
            <p>{detail}</p>
          </Link>
        ))}
      </nav>
      <section
        className={`${landing.decisionPair} ap-container`}
        aria-label="Decisions and evidence"
      >
        <article>
          <small>WHAT A DECISION LOOKS LIKE</small>
          <h2>Evidence before action.</h2>
          <p>
            Business strength, price conditions and your limits. Read the
            reasons behind the decision.
          </p>
          <Link className={landing.secondary} href="/research/NOW">
            Open the NOW research page
          </Link>
          <small>
            Live research may require sign-in. No result is implied by this
            preview.
          </small>
        </article>
        <article>
          <small>YOUR JUDGMENT, BETTER INFORMED</small>
          <h3>Read the business. Not just the headline.</h3>
          <h3>Test the price against the assumptions.</h3>
          <h3>Keep the opportunity and the risk together.</h3>
          <p>
            Scenarios are conditional. Ownership is not a recommendation. Check
            the date and coverage before acting.
          </p>
        </article>
      </section>
      {sampleOnly && (
        <>
          <InvestmentDemo />
          <ProductWalkthrough />
        </>
      )}
      <footer className={`${landing.footer} ap-container`}>
        <div className={landing.footerMain}>
          <PublicBrand />
          <nav aria-label="Footer navigation">
            <Link href="/#how-it-works">Product</Link>
            <Link href="/sample">Product guide</Link>
            <Link href="/pricing">Pricing</Link>
            <ContextLink page="help">Help</ContextLink>
            <Link href="/about">About</Link>
            <ContextLink page="changelog">What’s new</ContextLink>
            <Link href="/pace">AURYN Accumulation Pace</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </nav>
        </div>
        <div className={landing.footerLegal}>
          <span>© {new Date().getFullYear()} AURYN</span>
          <nav aria-label="Legal and methodology">
            <ContextLink page="methodology">Methodology</ContextLink>
            <ContextLink page="terms">Terms</ContextLink>
            <ContextLink page="privacy">Privacy</ContextLink>
            <PrivacyChoices compact />
            <ContextLink page="risk">Risks</ContextLink>
          </nav>
        </div>
        <p>
          Research supports your judgment. Investing involves risk. Product
          illustrations explain how AURYN works; they are not live
          recommendations.
        </p>
      </footer>
    </main>
  );
}
