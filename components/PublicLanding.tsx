"use client";
import { ContextLink } from "./ContextLink";
import PaceInstrument from "./PaceInstrument";
import experience from "./IntegratedExperience.module.css";
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
              AURYN Pace: P0 Pause · P1 Watch · P2 Initial · P3 Deeper · P4
              Deep. Completed month · confirmed. Current month · forming. Price
              zones, not predicted returns. Risk and business checks still
              apply.
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

/** A fictional research journey: no company, quote or return is presented as live. */
export function InvestmentDemo() {
  const [step, setStep] = useState(0);
  const steps = ["Discover", "Understand", "Plan"];
  return (
    <section
      className={landing.demo}
      id="investment-demo"
      aria-label="Interactive illustrative investment demo"
    >
      <header className={landing.demoHeader}>
        <span>
          <img src="/icon.svg" width="22" height="22" alt="" /> AURYN{" "}
          <small>/ RESEARCH WORKSPACE</small>
        </span>
        <span className={landing.sampleBadge}>Illustrative sample</span>
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
                "A business worth a closer look.",
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
          <div className={landing.researchRows}>
            <div>
              <span className={landing.companyMark}>A</span>
              <span>
                <strong>Example business</strong>
                <small>Fictional company · no live data</small>
              </span>
              <span className={landing.review}>Review</span>
            </div>
            <div>
              <Layers3 size={19} />
              <span>
                <strong>Business strength</strong>
                <small>
                  Read growth, cash generation and financial health together.
                </small>
              </span>
            </div>
            <div>
              <Scale size={19} />
              <span>
                <strong>Valuation still matters</strong>
                <small>
                  A strong business can still be an expensive investment.
                </small>
              </span>
            </div>
            <div>
              <ShieldCheck size={19} />
              <span>
                <strong>What could change the case?</strong>
                <small>Check debt, competition and missing evidence.</small>
              </span>
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
        {step === 2 && <PaceInstrument publicGuide compact />}
      </div>
      <footer className={landing.demoFooter}>
        <ShieldCheck size={15} />
        <span>Sample content · no live recommendation</span>
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
            <strong>Your AURYN Pace</strong>
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
      className={`mp-public ap-public ${experience.public} ${landing.page} ${sampleOnly ? "ap-sample-page" : ""}`}
    >
      <a className="ap-skip-link" href="#ap-main">
        Skip to content
      </a>
      <div className="ap-opening">
        <header
          className="ap-header"
          onKeyDown={(event) => {
            if (event.key === "Escape") setMenu(false);
          }}
        >
          <div className="ap-header-inner ap-container">
            <PublicBrand />
            <nav className="ap-nav" aria-label="Main navigation">
              <Link href="/sample">How it works</Link>
              <Link href="/pricing">Pricing</Link>
              <ContextLink page="methodology">Our approach</ContextLink>
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
                {menu ? <X size={21} /> : <Menu size={21} />}
              </button>
            </div>
          </div>
          {menu && (
            <nav
              id="ap-mobile-navigation"
              className="ap-mobile-navigation"
              aria-label="More public navigation"
            >
              <Link href="/sample" onClick={() => setMenu(false)}>
                How it works
              </Link>
              <Link href="/pricing" onClick={() => setMenu(false)}>
                Pricing
              </Link>
              <Link href="/methodology" onClick={() => setMenu(false)}>
                Our approach
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
            <span className={landing.eyebrow}>
              A CLEARER CASE FOR YOUR NEXT MOVE
            </span>
            <h1 id="ap-hero-heading">
              {sampleOnly ? (
                "See the thinking behind your next investment."
              ) : (
                <>
                  Your next investment decision,
                  <br />
                  <span>with the reasons attached.</span>
                </>
              )}
            </h1>
            <p>
              Decide where your next contribution deserves a closer look. See
              what the price expects, what the business is delivering, and what
              would make you reconsider.
            </p>
            <div className={landing.actions}>
              <Link className={landing.primary} href="/login?mode=signup">
                Start free <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <a className={landing.secondary} href="#investment-demo">
                Explore the demo <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            <p className={landing.heroNote}>
              Explore the product before you create an account.
            </p>
            <div className={landing.heroPrinciples}>
              <span>
                <Check size={15} /> Evidence before conviction
              </span>
              <span>
                <Check size={15} /> Your judgment, always
              </span>
            </div>
          </div>
          <div className={landing.heroVisual}>
            <InvestmentDemo />
            <div className={landing.previewCaption}>
              <span>01 — 03</span> From an interesting business to a considered
              decision.
            </div>
          </div>
        </section>
        <div
          className="ap-benefits ap-container"
          aria-label="What AURYN brings together"
        >
          <span>
            <Layers3 size={19} aria-hidden="true" />
            <strong>Compare your next contribution</strong>
            <small>Business, value and Pace in context.</small>
          </span>
          <span>
            <Scale size={19} aria-hidden="true" />
            <strong>Question the price</strong>
            <small>Make the earnings expectations explicit.</small>
          </span>
          <span>
            <ChartNoAxesCombined size={19} aria-hidden="true" />
            <strong>Know when to revisit</strong>
            <small>Evidence and conditions worth following.</small>
          </span>
        </div>
      </div>

      {sampleOnly && <ProductWalkthrough />}

      <section
        className={`${landing.workflow} ap-container`}
        aria-labelledby="ap-workflow-heading"
      >
        <div className={landing.workflowHeading}>
          <span className={landing.eyebrow}>PUT YOUR RESEARCH TO WORK</span>
          <h2 id="ap-workflow-heading">Less collecting. More deciding.</h2>
          <p>Move from an interesting company to a decision you can explain.</p>
        </div>
        <div className={landing.workflowRows}>
          <article>
            <span>01 / COMPARE</span>
            <div>
              <h3>Where should the next contribution go?</h3>
              <p>
                Compare companies using dated business evidence, valuation and
                AURYN Pace. Keep each dimension visible, so an attractive price
                zone cannot stand in for a strong business. Missing inputs stay
                explicit.
              </p>
            </div>
          </article>
          <article>
            <span>02 / CHALLENGE</span>
            <div>
              <h3>What does this price need to be true?</h3>
              <p>
                Explore price-implied earnings per share. Adjust the horizon and
                future earnings multiple to see the earnings those assumptions
                require. Compare expectations with available evidence, not a
                promised return.
              </p>
            </div>
          </article>
          <article>
            <span>03 / SEPARATE</span>
            <div>
              <h3>Has the business changed—or just the price?</h3>
              <p>
                Read business performance beside price context. Keep operating
                evidence, valuation assumptions and monthly Pace readings
                separate before deciding what a move means for your case.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section
        className={`${landing.evidence} ap-container`}
        aria-labelledby="evidence-heading"
      >
        <div>
          <span className={landing.eyebrow}>STAY WITH THE CASE</span>
          <h2 id="evidence-heading">
            A decision is a starting point.
            <br />
            Keep the reasons in view.
          </h2>
          <p>
            Know what to check next, what you are waiting for, and what has
            changed across the companies you follow.
          </p>
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
                Review available financial evidence and the conditions that
                would strengthen or weaken the case. Sources, dates and missing
                evidence stay visible.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Make waiting deliberate</h3>
              <p>
                Set out what would make a company worth another look. Use alerts
                for supported conditions; keep other conditions as research
                notes to check yourself.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Return to what matters to you</h3>
              <p>
                See relevant updates for companies you follow, with the
                available evidence and its date. Pick up the research that needs
                your attention.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section
        className={`${landing.faq} ap-container`}
        aria-labelledby="faq-heading"
      >
        <div>
          <span className={landing.eyebrow}>A FEW THINGS TO KNOW</span>
          <h2 id="faq-heading">Before you begin.</h2>
        </div>
        <div>
          <details>
            <summary>Can I explore AURYN without an account?</summary>
            <p>
              Yes. Use the interactive demo above or{" "}
              <Link href="/sample">explore the product guide</Link>. The
              examples explain the research process and contain no live
              investment recommendation.
            </p>
          </details>
          <details>
            <summary>Does Pace tell me to buy or sell?</summary>
            <p>
              No. Pace adds monthly price context to a business you have already
              assessed. P0 pauses additions; it does not mean Sell. Business
              quality, valuation, risk and your position limits still matter.
            </p>
          </details>
          <details>
            <summary>What happens when the evidence is incomplete?</summary>
            <p>
              An incomplete assessment stays in Review with the missing check
              explained. A price move alone does not establish a business case.
            </p>
          </details>
          <details>
            <summary>How do I choose a plan?</summary>
            <p>
              Start with Free and compare the available features and limits on
              the <Link href="/pricing">pricing page</Link>. Choose Pro when its
              additional research tools fit your needs.
            </p>
          </details>
        </div>
      </section>
      <section
        className={`${landing.closing} ap-container`}
        aria-labelledby="ap-closing-heading"
      >
        <div>
          <span className={landing.eyebrow}>
            YOUR NEXT INVESTMENT STARTS WITH A BETTER QUESTION
          </span>
          <h2 id="ap-closing-heading">Make room for a clearer decision.</h2>
          <p>Start with Free. Go deeper with Pro when you’re ready.</p>
        </div>
        <div className={landing.actions}>
          <Link className={landing.primary} href="/login?mode=signup">
            Start free <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className={landing.secondary} href="/pricing">
            Compare plans <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <footer className={`${experience.publicFooter} ap-container`}>
        <div className={experience.footerMain}>
          <PublicBrand />
          <nav aria-label="Footer navigation">
            <Link href="/sample">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <ContextLink page="help">Help</ContextLink>
            <Link href="/about">About</Link>
            <ContextLink page="changelog">What’s new</ContextLink>
            <Link href="/pace">AURYN Pace</Link>
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
