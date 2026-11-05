"use client";
import PaceInstrument from "./PaceInstrument";
import experience from "./IntegratedExperience.module.css";
import { PrivacyChoices } from "./AnalyticsConsent";
import { SUPPORT_EMAIL } from "@/lib/site-metadata";
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
      className={`mp-public ap-public ${sampleOnly ? "ap-sample-page" : ""}`}
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
              <Link href="/methodology">Our approach</Link>
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
        <section className={experience.hero} id="ap-main" aria-labelledby="ap-hero-heading">
          <div className={experience.heroVisual}><PaceInstrument publicGuide /></div>
          <div className={experience.heroCopy}><div>
            <span className={experience.brandEyebrow}>A clearer perspective on every investment</span>
            <h1 id="ap-hero-heading">{sampleOnly ? "Understand your next step." : "Invest with a sense of pace."}</h1>
            <p>{sampleOnly ? "Explore the five price zones, then connect them to business quality, valuation and your position limits." : "Know the business. Put the price in context. Give each contribution a considered place in your plan."}</p>
          </div><div className={experience.heroActions}>
            <Link href="/login?mode=signup">Start free <ArrowRight size={18}/></Link>
            <Link href={sampleOnly ? "#product-guide" : "/sample"}>{sampleOnly ? "Explore the guide" : "See how it works"} <ArrowRight size={17}/></Link>
          </div></div>
        </section>
        <div
          className="ap-benefits ap-container"
          aria-label="What AURYN brings together"
        >
          <span>
            <Layers3 size={19} aria-hidden="true" />
            <strong>Understand the business</strong>
            <small>Growth, cash generation and risk.</small>
          </span>
          <span>
            <Scale size={19} aria-hidden="true" />
            <strong>Test value and downside</strong>
            <small>Scenarios, assumptions and evidence.</small>
          </span>
          <span>
            <ChartNoAxesCombined size={19} aria-hidden="true" />
            <strong>Choose your pace</strong>
            <small>P0–P4 timing, separate from business quality.</small>
          </span>
        </div>
      </div>

      {sampleOnly && <ProductWalkthrough />}

      <section
        className="ap-workflow ap-container"
        aria-labelledby="ap-workflow-heading"
      >
        <div className="ap-section-heading">
          <span className="ap-eyebrow">FROM QUESTION TO DECISION</span>
          <h2 id="ap-workflow-heading">
            One question at a time. A fuller picture.
          </h2>
          <p>
            A connected view of what you own, what you’re watching, and what
            deserves a closer look.
          </p>
        </div>
        <div className="ap-workflow-grid signal-workflow-rows">
          <article>
            <span className="ap-feature-icon">
              <Search size={24} aria-hidden="true" />
            </span>
            <span className="ap-step">01 / UNDERSTAND</span>
            <h3>Get to know the business.</h3>
            <p>
              Explore financial performance, cash generation and the evidence
              behind the company’s story.
            </p>
          </article>
          <article>
            <span className="ap-feature-icon">
              <Scale size={24} aria-hidden="true" />
            </span>
            <span className="ap-step">02 / WEIGH IT UP</span>
            <h3>See the case. See the risks.</h3>
            <p>
              Bring the decision, valuation assumptions and business risks into
              one research view.
            </p>
          </article>
          <article>
            <span className="ap-feature-icon">
              <ChartNoAxesCombined size={24} aria-hidden="true" />
            </span>
            <span className="ap-step">03 / FIND YOUR PACE</span>
            <h3>Give each contribution context.</h3>
            <p>
              Use monthly price conditions alongside the business case, with
              confirmed and forming readings kept separate.
            </p>
          </article>
        </div>
      </section>

      <section
        className="ap-connected ap-container"
        aria-labelledby="ap-connected-heading"
      >
        <div className="ap-connected-copy">
          <span className="ap-eyebrow">ONE CONNECTED WORKSPACE</span>
          <h2 id="ap-connected-heading">Keep the whole picture in view.</h2>
          <p>
            Your research, watchlist and holdings belong together. Follow your
            companies and understand how each position fits into your portfolio.
          </p>
          <Link className="ap-text-link" href="/login?mode=signup">
            Build your workspace <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="ap-connected-list">
          <div>
            <Layers3 size={22} aria-hidden="true" />
            <span>
              <strong>Research</strong>
              <p>The decision, the reasons, the deeper detail.</p>
            </span>
          </div>
          <div>
            <Search size={22} aria-hidden="true" />
            <span>
              <strong>Watchlist</strong>
              <p>A place for the companies on your radar.</p>
            </span>
          </div>
          <div>
            <PieChart size={22} aria-hidden="true" />
            <span>
              <strong>Portfolio</strong>
              <p>Holdings, performance and concentration.</p>
            </span>
          </div>
        </div>
      </section>

      <section
        className="ap-closing ap-container"
        aria-labelledby="ap-closing-heading"
      >
        <div>
          <span className="ap-eyebrow">YOUR NEXT MOVE STARTS HERE</span>
          <h2 id="ap-closing-heading">Make it an informed one.</h2>
          <p>Start with Free. Go deeper with Pro.</p>
        </div>
        <div className="ap-closing-actions">
          <Link
            className="ap-button ap-button-primary"
            href="/login?mode=signup"
          >
            Create your account <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="ap-text-link" href="/pricing">
            Compare plans <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
      <footer className="ap-footer ap-container">
        <div className="ap-footer-main">
          <PublicBrand />
          <nav aria-label="Footer navigation">
            <Link href="/sample">How it works</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/help">Help</Link>
            <Link href="/about">About</Link>
            <Link href="/pace">AURYN Pace</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </nav>
        </div>
        <div className="ap-footer-bottom">
          <span>© {new Date().getFullYear()} AURYN</span>
          <nav aria-label="Legal and methodology">
            <Link href="/methodology">Methodology</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <PrivacyChoices />
            <Link href="/risk">Risks</Link>
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
