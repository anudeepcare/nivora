"use client";
import "./PublicLandingRefresh.css";
import PublicPlaidOpening from "./PublicPlaidOpening";
import { ContextLink } from "./ContextLink";
import PaceInstrument from "./PaceInstrument";
import experience from "./IntegratedExperience.module.css";
import landing from "./PublicLanding.module.css";
import { PrivacyChoices } from "./AnalyticsConsent";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sun,
  Moon,
  ChartNoAxesCombined,
  Check,
  ShieldCheck,
  Layers3,
  Scale,
} from "lucide-react";

function PublicThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    setTheme(
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );
  }, []);
  return (
    <button
      type="button"
      className={landing.themeToggle}
      aria-label={`Use ${theme === "dark" ? "day" : "night"} theme`}
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        document.documentElement.style.colorScheme = next;
        try {
          localStorage.setItem("auryn-product-theme", next);
        } catch {
          /* Optional preference. */
        }
        setTheme(next);
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

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
      className={`ap-product signal-public-demo ${compact ? "ap-product-compact" : ""}`}
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
                    <stop
                      offset="0%"
                      stopColor="var(--landing-accent)"
                      stopOpacity=".23"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--landing-accent)"
                      stopOpacity="0"
                    />
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
                  stroke="var(--landing-accent)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M12 129C47 129 46 116 70 119S124 105 155 112S205 87 240 101S289 119 325 97S378 75 410 89S451 75 468 70"
                  fill="none"
                  stroke="var(--guide-secondary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="468"
                  cy="28"
                  r="5"
                  fill="var(--landing-accent)"
                  stroke="var(--card)"
                  strokeWidth="4"
                />
                <circle cx="468" cy="70" r="4" fill="var(--guide-secondary)" />
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

/** Concept diagrams show the work a lens does, never invented company observations. */
function ResearchDiagram({ lens = 0 }: { lens?: number }) {
  const labels = [
    "Business, value, change, Pace, risk and ownership connected to your review",
    "One set of assumptions branches into bear, base and bull scenarios",
    "Company events connected with their dates, sources and research context",
    "Company ownership connected to institutions, insiders and public filings",
    "Five Pace conditions from pause to deeper accumulation, checked against business and portfolio limits",
  ];
  return (
    <figure className={landing.researchDiagram}>
      <svg viewBox="0 0 420 340" role="img" aria-label={labels[lens]}>
        {lens === 0 && (
          <>
            {[118, 80, 43].map((radius) => (
              <circle
                key={radius}
                cx="210"
                cy="162"
                r={radius}
                className={landing.orbitRing}
              />
            ))}
            {(
              [
                ["Business", "Evidence", 210, 35],
                ["Value", "Assumptions", 340, 95],
                ["Change", "Events", 340, 235],
                ["Pace", "Conditions", 210, 290],
                ["Risk", "Limits", 80, 235],
                ["Ownership", "Filings", 80, 95],
              ] as const
            ).map(([title, detail, x, y]) => (
              <g key={title}>
                <line x1="210" y1="162" x2={x} y2={y} />
                <circle cx={x} cy={y} r="34" />
                <text x={x} y={y - 2} textAnchor="middle">
                  {title}
                </text>
                <text
                  x={x}
                  y={y + 15}
                  textAnchor="middle"
                  className={landing.diagramDetail}
                >
                  {detail}
                </text>
              </g>
            ))}
            <circle cx="210" cy="162" r="44" className={landing.diagramCore} />
            <text
              x="210"
              y="157"
              textAnchor="middle"
              className={landing.diagramCoreText}
            >
              YOUR
            </text>
            <text
              x="210"
              y="177"
              textAnchor="middle"
              className={landing.diagramCoreText}
            >
              REVIEW
            </text>
          </>
        )}
        {lens === 1 && (
          <>
            <text x="210" y="33" textAnchor="middle">
              Growth · margins · future multiple
            </text>
            <path d="M105 170 C190 170 180 80 270 80 M105 170H270 M105 170 C190 170 180 260 270 260" />
            <rect x="25" y="140" width="115" height="60" rx="12" />
            <text x="82" y="166" textAnchor="middle">
              Your
            </text>
            <text x="82" y="184" textAnchor="middle">
              assumptions
            </text>
            {(
              [
                ["Bear", "Lower case", 55],
                ["Base", "Central case", 145],
                ["Bull", "Upper case", 235],
              ] as const
            ).map(([title, detail, y], index) => (
              <g key={title}>
                <rect
                  x="270"
                  y={y}
                  width="120"
                  height="50"
                  rx="10"
                  className={landing[`scenario${index}`]}
                />
                <text x="330" y={y + 21} textAnchor="middle">
                  {title}
                </text>
                <text
                  x="330"
                  y={y + 38}
                  textAnchor="middle"
                  className={landing.diagramDetail}
                >
                  {detail}
                </text>
              </g>
            ))}
            <text
              x="210"
              y="325"
              textAnchor="middle"
              className={landing.diagramDetail}
            >
              Scenarios are conditional, not forecasts.
            </text>
          </>
        )}
        {lens === 2 && (
          <>
            <line x1="55" y1="155" x2="365" y2="155" />
            {(
              [
                ["Results", "What changed?", 70],
                ["Filings", "What is new?", 210],
                ["News", "Why it matters", 350],
              ] as const
            ).map(([title, detail, x]) => (
              <g key={title}>
                <circle
                  cx={x}
                  cy="155"
                  r="12"
                  className={landing.diagramCore}
                />
                <line x1={x} y1="168" x2={x} y2="205" />
                <text x={x} y="120" textAnchor="middle">
                  {title}
                </text>
                <text
                  x={x}
                  y="230"
                  textAnchor="middle"
                  className={landing.diagramDetail}
                >
                  {detail}
                </text>
              </g>
            ))}
            <text x="210" y="55" textAnchor="middle">
              Keep the sequence in view
            </text>
            <text
              x="210"
              y="290"
              textAnchor="middle"
              className={landing.diagramDetail}
            >
              Each available item retains its source and date.
            </text>
          </>
        )}
        {lens === 3 && (
          <>
            {(
              [
                ["Insiders", 75, 70],
                ["Institutions", 345, 70],
                ["Transactions", 75, 260],
                ["Holdings", 345, 260],
              ] as const
            ).map(([title, x, y]) => (
              <g key={title}>
                <line x1="210" y1="165" x2={x} y2={y} />
                <rect x={x - 57} y={y - 24} width="114" height="48" rx="12" />
                <text x={x} y={y + 5} textAnchor="middle">
                  {title}
                </text>
              </g>
            ))}
            <circle cx="210" cy="165" r="51" className={landing.diagramCore} />
            <text
              x="210"
              y="161"
              textAnchor="middle"
              className={landing.diagramCoreText}
            >
              COMPANY
            </text>
            <text
              x="210"
              y="180"
              textAnchor="middle"
              className={landing.diagramCoreText}
            >
              FILINGS
            </text>
            <text
              x="210"
              y="320"
              textAnchor="middle"
              className={landing.diagramDetail}
            >
              Reporting delays remain visible.
            </text>
          </>
        )}
        {lens === 4 && (
          <>
            <text x="210" y="45" textAnchor="middle">
              Price conditions, not position sizes
            </text>
            {["Pause", "Watch", "Initial", "Deeper", "Deep"].map(
              (title, index) => (
                <g key={title}>
                  <rect
                    x={22 + index * 78}
                    y={155 - index * 15}
                    width="66"
                    height={70 + index * 15}
                    rx="8"
                    className={landing.paceStep}
                  />
                  <text
                    x={55 + index * 78}
                    y={184 - index * 15}
                    textAnchor="middle"
                  >
                    P{index}
                  </text>
                  <text
                    x={55 + index * 78}
                    y="247"
                    textAnchor="middle"
                    className={landing.diagramDetail}
                  >
                    {title}
                  </text>
                </g>
              ),
            )}
            <text
              x="210"
              y="292"
              textAnchor="middle"
              className={landing.diagramDetail}
            >
              Business checks → cash → concentration limits
            </text>
          </>
        )}
      </svg>
      <figcaption>Framework illustration · not live company data</figcaption>
    </figure>
  );
}

function ReferenceProductTour() {
  const [active, setActive] = useState(0);
  const lenses = [
    [
      "Decision Atlas",
      "THE ANSWER",
      "See the business before the price.",
      "Bring business evidence, valuation and your investment case into one connected view.",
      "Snapshot",
    ],
    [
      "Scenario engine",
      "THE ASSUMPTIONS",
      "Make the future explicit.",
      "Compare bear, base and bull cases. Inspect the assumptions rather than treating a model as a promise.",
      "Valuation",
    ],
    [
      "Catalyst calendar",
      "WHAT CHANGED",
      "Keep the next event in context.",
      "Review dated company news and events alongside your research, with sources and coverage visible.",
      "News",
    ],
    [
      "Ownership network",
      "WHO IS ACTING",
      "Follow the filings, not the noise.",
      "Inspect available ownership and insider evidence with reporting dates and filing delays in view.",
      "Thesis",
    ],
    [
      "Pace simulator",
      "YOUR NEXT CONTRIBUTION",
      "Build at your own pace.",
      "Explore accumulation conditions after business checks, within your cash and position limits.",
      "Pace",
    ],
  ];
  return (
    <div className={`${landing.productTour} public-tour`}>
      <div
        role="tablist"
        aria-orientation="vertical"
        aria-label="Explore the research workspace"
        className={`${landing.tourTabs} public-tour-tabs`}
      >
        {lenses.map(([title], index) => (
          <button
            key={title}
            type="button"
            role="tab"
            id={`tour-tab-${index}`}
            aria-controls={`tour-panel-${index}`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key))
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? lenses.length - 1
                    : (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        lenses.length) %
                      lenses.length;
              setActive(next);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus();
            }}
          >
            <span>0{index + 1}</span>
            {title}
          </button>
        ))}
      </div>
      {lenses.map(([title, kicker, headline, detail, tab], index) => (
        <div
          key={title}
          role="tabpanel"
          id={`tour-panel-${index}`}
          aria-labelledby={`tour-tab-${index}`}
          hidden={active !== index}
          className={`${landing.tourPanel} public-tour-panel`}
        >
          <ResearchDiagram lens={index} />
          <div className={landing.tourReadout}>
            <span className={landing.eyebrow}>{kicker}</span>
            <h3>{headline}</h3>
            <p>{detail}</p>
            <small>
              Product guide. Live coverage, dates and missing evidence appear in
              research.
            </small>
            <Link href={`/research/APP?tab=${tab}`}>
              Open the live workspace <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ))}
    </div>
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
  useEffect(() => {
    if (!sampleOnly) return;
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
  }, [sampleOnly]);

  return (
    <main
      className={`mp-public ap-public public-reading-layout ${experience.public} ${landing.page} ${sampleOnly ? "ap-sample-page" : ""}`}
    >
      <a className="ap-skip-link" href="#ap-main">
        Skip to content
      </a>
      <PublicPlaidOpening
        brand={<PublicBrand />}
        themeControl={<PublicThemeToggle />}
      />

      {sampleOnly && <ProductWalkthrough />}
      <section
        className={`${landing.referenceStory} public-story`}
        id="how-it-works"
        aria-labelledby="reference-story-title"
      >
        <span className={landing.eyebrow}>
          ONE COMPANY · ONE CONNECTED STORY
        </span>
        <h2 id="reference-story-title">One company. A clearer picture.</h2>
        <p>Choose a view to see how the research connects.</p>
        {sampleOnly ? <InvestmentDemo /> : <ReferenceProductTour />}
      </section>

      <section
        className={`${landing.evidence} ap-container public-continuity`}
        aria-labelledby="evidence-heading"
      >
        <div>
          <span className={landing.eyebrow}>STAY WITH THE CASE</span>
          <h2 id="evidence-heading">Keep your research moving.</h2>
          <p>Follow the companies and changes that matter to you.</p>
          <ContextLink page="methodology">
            Explore our methodology <ArrowRight size={17} aria-hidden="true" />
          </ContextLink>
        </div>
        <div className={landing.evidenceList}>
          <article>
            <span>01</span>
            <div>
              <h3>Turn earnings into questions</h3>
              <p>
                Review the results, their dates and what could change your case.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Make waiting deliberate</h3>
              <p>
                Use alerts for supported conditions. Keep other checks in your
                research notes.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Return to what matters to you</h3>
              <p>Return to dated updates from the companies you follow.</p>
            </div>
          </article>
        </div>
      </section>
      <section
        className={`${landing.referencePace} public-pace`}
        id="pace-public"
        aria-labelledby="reference-pace-title"
      >
        <span className={landing.eyebrow}>AURYN ACCUMULATION PACE</span>
        <h2 id="reference-pace-title">A buying rhythm, not another rating.</h2>
        <p>
          Pace separates business qualification from price conditions and
          portfolio capacity.
        </p>
        <div>
          {[
            ["P0", "Pause", "Price extension or unsupported conditions"],
            ["P1", "Watch", "No accumulation zone established"],
            ["P2", "Start small", "Initial qualifying price zone"],
            ["P3", "Build", "Deeper qualifying price zone"],
            ["P4", "Deep zone", "Strongest planned accumulation zone"],
          ].map(([level, label, description]) => (
            <article key={level}>
              <span>{level}</span>
              <h3>{label}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <p>
          Pace is a condition, not a position-size instruction. Cash,
          concentration, and your saved limits still apply. Current-month
          readings remain forming.
        </p>
        <Link href="/pace">Explore Pace methodology →</Link>
      </section>
      <section
        className={`${landing.referenceCases} public-questions`}
        id="use-cases"
        aria-labelledby="reference-cases-title"
      >
        <span className={landing.eyebrow}>
          BUILT AROUND THE QUESTIONS INVESTORS ACTUALLY ASK
        </span>
        <h2 id="reference-cases-title">Start with your question.</h2>
        <div>
          {[
            [
              "Where should my next contribution go?",
              "Compare business evidence, valuation, Pace, and portfolio capacity across followed companies.",
              "/compare",
            ],
            [
              "What does this price need to be true?",
              "Change growth, margins, horizon, and exit multiple in an interactive assumption engine.",
              "/research/APP?tab=Valuation",
            ],
            [
              "Did the business change, or just the stock?",
              "Separate operating evidence from market moves and repeated news.",
              "/research/APP?tab=News",
            ],
            [
              "What could prove me wrong?",
              "Keep risk checks and explicit invalidation conditions beside the evidence.",
              "/research/APP?tab=Thesis",
            ],
            [
              "Who is buying or selling?",
              "Inspect ownership and insider activity with filing-delay and coverage context.",
              "/research/APP?tab=Thesis",
            ],
            [
              "How should I express the view?",
              "Explore accumulation conditions or defined-risk options with visible assumptions.",
              "/research/APP?tab=Options",
            ],
          ].map(([title, description, href], index) => (
            <details key={title} className="public-question">
              <summary>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <span aria-hidden="true">+</span>
              </summary>
              <p>{description}</p>
              <Link href={href}>Explore use case →</Link>
            </details>
          ))}
        </div>
      </section>
      <section
        className={`${landing.closing} ap-container public-start`}
        id="pricing"
        aria-labelledby="ap-closing-heading"
      >
        <div>
          <span className={landing.eyebrow}>YOUR RESEARCH. YOUR PACE.</span>
          <h2 id="ap-closing-heading">A clearer view starts here.</h2>
          <p>
            Compare Free and Pro features, availability, and billing terms
            before choosing.
          </p>
        </div>
        <div className={landing.actions}>
          <Link className={landing.primary} href="/login?mode=signup">
            Get started <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className={landing.secondary} href="/pricing">
            Compare plans <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <footer
        className={`${experience.publicFooter} ${landing.footer} ap-container`}
      >
        <div className={experience.footerMain}>
          <PublicBrand />
          <nav aria-label="Footer navigation">
            <Link href="/#how-it-works">Product</Link>
            <Link href="/sample">Product guide</Link>
            <Link href="/pricing">Pricing</Link>
            <ContextLink page="help">Help</ContextLink>
            <Link href="/about">About</Link>
            <Link href="/track-record">Evidence & track record</Link>
            <Link href="/portfolio-check">Check your portfolio</Link>
            <ContextLink page="changelog">What’s new</ContextLink>
            <Link href="/pace">AURYN Accumulation Pace</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </nav>
        </div>
        <div className={experience.footerLegal}>
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
