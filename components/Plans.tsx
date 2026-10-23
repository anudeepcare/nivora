"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import {
  defaultAccessConfig,
  featureNames,
  type AccessConfig,
  type Access,
  type Feature,
} from "@/lib/access-policy";
import { useAccess } from "./Access";
type Billing = {
  ready: boolean;
  mode: string;
  config: AccessConfig;
  access: Access;
  subscription: {
    status: string;
    paid_until: string;
    cancel_at_period_end: boolean;
  } | null;
  canManage: boolean;
  setup: string[];
};
export function PricingCards({
  config = defaultAccessConfig,
  access,
  ready = false,
  busy = false,
  onUpgrade,
  publicPage = true,
}: {
  config?: AccessConfig;
  access?: Access;
  ready?: boolean;
  busy?: boolean;
  onUpgrade?: () => void;
  publicPage?: boolean;
}) {
  const included = (plan: "free" | "pro") =>
    (Object.keys(featureNames) as Feature[]).filter((k) => {
      const r = config.rules[k] ?? "pro";
      return r === "free" || (plan === "pro" && r === "pro");
    });
  const owner = access?.owner;
  return (
    <div className="pricing-cards">
      {(["free", "pro"] as const).map((plan) => (
        <section
          key={plan}
          className={plan === "pro" ? "pricing-pro" : ""}
          aria-label={`${plan === "free" ? "Free" : "Pro"} plan`}
        >
          <div className="pricing-card-title">
            <h2>{plan === "free" ? "Free" : "Pro"}</h2>
            {!publicPage && access?.plan === plan && (
              <span className="plan-pill">
                {owner ? "Included" : "Current plan"}
              </span>
            )}
          </div>
          <p className="pricing-amount">
            {plan === "free" ? "$0" : "$2.99"}
            <small>{plan === "free" ? " / forever" : " / month"}</small>
          </p>
          <p>
            {plan === "free"
              ? "Get to know a company."
              : "Go deeper before your next decision."}
          </p>
          <ul>
            <li>
              {plan === "pro"
                ? "Unlimited company research"
                : "100 companies / month"}
            </li>
            {included(plan).map((k) => (
              <li key={k}>{featureNames[k]}</li>
            ))}

          </ul>
          {publicPage ? (
            <Link
              className={`button ${plan === "pro" ? "primary" : ""}`}
              href={
                plan === "free" ? "/login?mode=signup" : "/login?next=%2Fplans"
              }
            >
              {plan === "free" ? "Get started free" : "Explore Pro"}
            </Link>
          ) : plan === "free" ? (
            access?.plan === "free" && access.admitted ? (
              <Link className="button" href="/overview">
                Continue with Free
              </Link>
            ) : (
              <span className="pricing-current">
                {access?.plan === "free"
                  ? "Your current plan"
                  : "Always available"}
              </span>
            )
          ) : (
            <button
              className="button primary"
              disabled={
                busy ||
                owner ||
                (access?.plan === "pro" && access.source !== "complimentary") ||
                !ready
              }
              onClick={onUpgrade}
            >
              {busy
                ? "Opening…"
                : owner
                  ? "Included with owner access"
                  : access?.source === "complimentary" && ready
                    ? "Subscribe for $2.99/month"
                    : access?.plan === "pro"
                      ? "Your Pro access"
                      : ready
                        ? "Upgrade to Pro"
                        : "Coming soon"}
            </button>
          )}
        </section>
      ))}
    </div>
  );
}
function SignedInPlans() {
  const { access, refresh } = useAccess(),
    [billing, setBilling] = useState<Billing | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const portalReturn =
      new URLSearchParams(window.location.search).get("billing") === "return";
    const returned = new URLSearchParams(window.location.search).get(
      "checkout",
    );
    let attempts = 0;
    async function load() {
      try {
        if (returned === "success" || portalReturn) {
          await api("billing", { action: "sync" }, abort.signal);
        }
        const b = await api<Billing>("billing", undefined, abort.signal);
        if (abort.signal.aborted) return;
        setBilling(b);
        if (portalReturn) {
          refresh();
          window.history.replaceState(null, "", "/plans");
        }
        if (returned === "success") {
          if (b.access.source === "subscription") {
            setMessage("You’re on Pro. Welcome aboard.");
            refresh();
            window.history.replaceState(null, "", "/plans");
          } else if (attempts++ < 5) {
            setMessage("Confirming your payment…");
            timer = setTimeout(load, 3000);
          } else
            setMessage(
              "Payment confirmation is still processing. Refresh this page shortly.",
            );
        } else if (returned === "cancelled")
          setMessage("Checkout cancelled. Your plan is unchanged.");
        else if (
          new URLSearchParams(window.location.search).get("welcome") === "1"
        )
          setMessage("Your account is ready. Review your membership below.");
      } catch (e) {
        if (!abort.signal.aborted)
          setMessage(
            e instanceof Error ? e.message : "Plans could not be loaded.",
          );
      }
    }
    void load();
    return () => {
      abort.abort();
      if (timer) clearTimeout(timer);
    };
  }, [refresh]);
  async function open(action: "checkout" | "portal") {
    setBusy(true);
    setMessage("");
    try {
      const r = await api<{ url: string }>("billing", { action });
      const url = new URL(r.url);
      if (
        url.protocol !== "https:" ||
        !["checkout.stripe.com", "billing.stripe.com"].includes(url.hostname)
      )
        throw Error("The payment page could not be opened.");
      window.location.assign(url.href);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
      setBusy(false);
    }
  }
  const a = billing?.access ?? access,
    owner = a.owner,
    sub = billing?.subscription;
  const date = (s: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(s),
    );
  return (
    <>
      {message && (
        <section className="membership-feedback" role="status">
          <strong>{message}</strong>
          {billing?.access.source === "subscription" && (
            <p>
              <Link className="button primary" href="/overview">
                Open your workspace
              </Link>
            </p>
          )}
        </section>
      )}
      <PricingCards
        config={billing?.config}
        access={a}
        ready={!!billing?.ready}
        busy={busy}
        publicPage={false}
        onUpgrade={() => void open("checkout")}
      />
      <section className="plan-account-row" aria-label="Your membership">
        <div>
          <strong>
            {owner
              ? "Owner · Full access"
              : a.source === "complimentary"
                ? "Complimentary Pro"
                : a.plan === "pro"
                  ? "AURYN Pro"
                  : "AURYN Free"}
          </strong>
          {owner ? (
            <p>You have access to the full workspace.</p>
          ) : a.source === "complimentary" ? (
            <p>
              Included until {date(a.grantUntil!)}. You can subscribe anytime;
              your access stays active during checkout.
            </p>
          ) : sub && a.source === "subscription" ? (
            <p>
              {sub.status === "past_due" ? "Payment needs attention. " : ""}
              {sub.cancel_at_period_end ? "Access ends" : "Paid through"}{" "}
              {date(sub.paid_until)}.
            </p>
          ) : (
            <p>
              {a.sampleOnly
                ? "Market data is currently unavailable."
                : a.limits.research === -1
                  ? "Unlimited company research."
                  : `${access.researchUsed === -1 ? "Usage unavailable" : (access.researchUsed ?? 0) + " of 100 companies explored this month"}.`}
            </p>
          )}
        </div>
        {owner ? (
          <Link className="button" href="/owner">
            Admin controls
          </Link>
        ) : billing?.canManage && a.source === "subscription" ? (
          <button
            className="button"
            disabled={busy || !billing.ready}
            onClick={() => void open("portal")}
          >
            Manage subscription
          </button>
        ) : null}
      </section>
      {billing?.mode === "test" && billing.ready && (
        <p className="plans-footnote">Test checkout · no real charges.</p>
      )}
      {owner && billing?.setup.length ? (
        <p className="plans-footnote">
          Payment setup: {billing.setup.join(", ")}.
        </p>
      ) : null}
    </>
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
        <span className="eyebrow">AURYN membership</span>
        <h1>More clarity. Your choice.</h1>
        <p>Start free. Go deeper with Pro.</p>
      </header>
      {publicPage ? <PricingCards /> : <SignedInPlans />}
      <p className="plans-footnote">
        Secure checkout by Stripe. AURYN does not store full card numbers or
        security codes. Monthly billing. Cancel future renewals in Manage
        subscription; paid access continues through the billing period. Research
        support, not investment advice.
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
