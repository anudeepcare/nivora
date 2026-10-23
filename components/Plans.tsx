"use client";
import Link from "next/link";
import PlanPanel from "./PlanPanel";
export function PricingCards() {
  return (
    <div className="pricing-cards">
      <section>
        <span className="eyebrow">Start exploring</span>
        <h2>Free</h2>
        <p className="pricing-amount">$0</p>
        <p>
          Limited company research, a small watchlist and a clear introduction
          to AURYN.
        </p>
        <ul>
          <li>Basic company snapshot</li>
          <li>Monthly company allowance</li>
          <li>Clearly labelled sample beta</li>
        </ul>
        <Link className="button" href="/login?mode=signup">
          Create a free account
        </Link>
      </section>
      <section className="pricing-pro">
        <span className="eyebrow">Planned launch plan</span>
        <h2>Pro</h2>
        <p className="pricing-amount">
          $2.99 <small>/ month</small>
        </p>
        <p>
          Deeper company evidence, valuation, technical research and the
          Advanced workbench.
        </p>
        <ul>
          <li>Expanded research and watchlist limits</li>
          <li>Financials, scenarios and analyst context</li>
          <li>Owner-configured feature access</li>
        </ul>
        <button className="button primary" disabled>
          Payments not open yet
        </button>
        <small>
          Pro features can be tested through an owner invitation. No card
          required; invitations expire.
        </small>
      </section>
    </div>
  );
}
export default function Plans({
  publicPage = false,
}: {
  publicPage?: boolean;
}) {
  return (
    <div className={`plans-page ${publicPage ? "plans-public" : ""}`}>
      {publicPage && (
        <nav aria-label="Plans navigation">
          <Link href="/" className="brand-link">
            AURYN
          </Link>
          <Link href="/login">Sign in →</Link>
        </nav>
      )}
      <header className="plans-heading">
        <span className="eyebrow">Plans & access</span>
        <h1>Clear plans. One place.</h1>
        <p>
          Explore Free, understand Pro, and see exactly where access stands.
        </p>
      </header>
      {!publicPage && <PlanPanel />}
      <PricingCards />
      <p className="plans-footnote">
        Private beta. These are planned launch tiers; limits and features are
        controlled by the owner. Billing, cancellation and payment management
        are not available until checkout is connected.
      </p>
      {publicPage && (
        <footer>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/risk">Investment risks</Link>
        </footer>
      )}
    </div>
  );
}
