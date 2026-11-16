"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowRight,
  Layers3,
  ChartNoAxesCombined,
  PieChart,
  Menu,
  X,
  Check,
} from "lucide-react";
import { authClient } from "@/lib/client";
import { PrivacyChoices } from "./AnalyticsConsent";
import styles from "./PublicLanding.module.css";

export function PublicSample({ compact = false }: { compact?: boolean } = {}) {
  const lenses = [
    {
      name: "Business",
      icon: Layers3,
      title: "Understand what you own.",
      text: "Growth, cash generation and risk. Together, not scattered across a dozen tabs.",
      points: [
        "Revenue & margins",
        "Cash flow & balance sheet",
        "The investment case",
      ],
    },
    {
      name: "Value",
      icon: ChartNoAxesCombined,
      title: "Give the price perspective.",
      text: "Compare bear, base and bull scenarios with the assumptions behind them.",
      points: [
        "Three scenarios",
        "Analyst expectations",
        "Your entry assumptions",
      ],
    },
    {
      name: "Pace",
      icon: ChartNoAxesCombined,
      title: "Find your next step.",
      text: "Put the monthly price zone alongside business strength and your limits. A zone alone is not a recommendation.",
      points: [
        "P0 · Pause",
        "P1 · Watch or hold",
        "P2 · Start small",
        "P3 · Add gradually",
        "P4 · Highest planned pace",
      ],
    },
  ];

  const [active, setActive] = useState(0);
  const lens = lenses[active];
  return (
    <section
      className={`${styles.preview} ${compact ? styles.compact : ""}`}
      aria-label="Illustrative product guide, not a live investment recommendation"
    >
      <div className={styles.previewTop}>
        <span className={styles.miniBrand}>
          <img src="/icon.svg" width="22" height="22" alt="" /> AURYN
        </span>
        <span className={styles.caption}>Product guide · not live data</span>
      </div>
      <div className={styles.tabs} role="tablist" aria-label="Explore Auryn">
        {lenses.map((item, index) => (
          <button
            key={item.name}
            role="tab"
            id={`public-${compact}-tab-${index}`}
            aria-controls={`public-${compact}-panel`}
            aria-selected={active === index}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 2
                    : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
              setActive(next);
              event.currentTarget.parentElement
                ?.querySelectorAll<HTMLButtonElement>("button")
                [next]?.focus();
            }}
          >
            <item.icon size={16} />
            {item.name}
          </button>
        ))}
      </div>
      <div
        className={styles.previewBody}
        role="tabpanel"
        id={`public-${compact}-panel`}
        aria-labelledby={`public-${compact}-tab-${active}`}
      >
        <div className={styles.lensIcon}>
          <lens.icon size={27} strokeWidth={1.5} />
        </div>
        <h2>{lens.title}</h2>
        <p>{lens.text}</p>
        <div className={styles.points}>
          {lens.points.map((point) => (
            <span key={point}>
              <Check size={16} />
              {point}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.previewFoot}>
        <span className={styles.dot} />
        Evidence first. Your judgment always.
        <Link href="/methodology">
          Methodology <ArrowUpRight size={12} />
        </Link>
      </div>
    </section>
  );
}
export function InvestmentDemo() {
  return <PublicSample />;
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
    let active = true;
    try {
      void authClient()
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
    <div
      className={styles.page}
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu) {
          event.preventDefault();
          setMenu(false);
          event.currentTarget
            .querySelector<HTMLButtonElement>('[aria-controls="public-menu"]')
            ?.focus();
        }
      }}
    >
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="AURYN home">
          <img src="/icon.svg" width="30" height="30" alt="" />
          AURYN
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          <Link href="/#how-it-works">The workspace</Link>
          <Link href="/sample" onClick={() => setMenu(false)}>
            Product guide
          </Link>
          <Link href="/pricing" onClick={() => setMenu(false)}>
            Pricing
          </Link>
        </nav>
        <div className={styles.headerActions}>
          <Link href="/login">
            Sign in <ArrowUpRight size={15} />
          </Link>
          <button
            aria-label={menu ? "Close navigation" : "Open navigation"}
            aria-expanded={menu}
            aria-controls="public-menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>
      {menu && (
        <nav
          id="public-menu"
          className={styles.mobileMenu}
          aria-label="Mobile navigation"
        >
          <Link href="/#how-it-works" onClick={() => setMenu(false)}>
            The workspace
          </Link>
          <Link href="/sample" onClick={() => setMenu(false)}>
            Product guide
          </Link>
          <Link href="/pricing" onClick={() => setMenu(false)}>
            Pricing
          </Link>
        </nav>
      )}
      <main id="main">
        <section className={styles.hero}>
          <div className={styles.intro}>
            <span className={styles.eyebrow}>
              <span className={styles.dot} /> YOUR INVESTMENT WORKSPACE
            </span>
            <h1>
              {sampleOnly ? (
                <>
                  A clearer way
                  <br />
                  to research.
                </>
              ) : (
                <>
                  Less noise.
                  <br />
                  <span>More perspective.</span>
                </>
              )}
            </h1>
            <p>
              Understand the business. Put the price in context. Make your next
              move with a clearer view.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/login?mode=signup">
                Open your workspace <ArrowRight size={18} />
              </Link>
              <Link className={styles.textAction} href="#how-it-works">
                See how it works <ArrowUpRight size={17} />
              </Link>
            </div>
            <span className={styles.heroNote}>
              Your research. Your pace. Your decision.
            </span>
          </div>
          <PublicSample />
        </section>
        <section
          id="how-it-works"
          className={styles.workflow}
          aria-labelledby="workflow-heading"
        >
          <div className={styles.sectionIntro}>
            <span className={styles.eyebrow}>FROM QUESTION TO PERSPECTIVE</span>
            <h2 id="workflow-heading">
              One connected view.
              <br />
              Three better questions.
            </h2>
          </div>
          <div className={styles.steps}>
            {[
              {
                title: "Is it a good business?",
                text: "Look beyond the headline. Connect growth, profitability and financial strength.",
                icon: Layers3,
              },
              {
                title: "Does the price make sense?",
                text: "See the range of outcomes. Keep scenario assumptions and analyst targets distinct.",
                icon: ChartNoAxesCombined,
              },
              {
                title: "What does it mean for me?",
                text: "Review the opportunity alongside your holdings, concentration and limits.",
                icon: PieChart,
              },
            ].map((step, index) => (
              <article key={step.title}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <step.icon size={25} strokeWidth={1.5} />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className={styles.closing}>
          <img src="/icon.svg" width="50" height="50" alt="" />
          <h2>
            A little more clarity.
            <br />
            Every time you look.
          </h2>
          <Link className={styles.primary} href="/login?mode=signup">
            Get started <ArrowRight size={18} />
          </Link>
        </section>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <Link className={styles.brand} href="/" aria-label="AURYN home">
            <img src="/icon.svg" width="24" height="24" alt="" />
            AURYN
          </Link>
          <nav aria-label="Footer navigation">
            <Link href="/help">Help</Link>
            <Link href="/methodology">Methodology</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} AURYN</span>
          <div>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <PrivacyChoices />
            <Link href="/risk">Risk disclosure</Link>
          </div>
        </div>
        <p>
          Research supports your judgment. Investing involves risk. Product
          illustrations are not live recommendations.
        </p>
      </footer>
    </div>
  );
}
