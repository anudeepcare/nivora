import type { Research } from "./types";
export const featureNames = {
  overview: "Complete overview",
  business: "Business analysis",
  financials: "Financial statements",
  value: "Value scenarios",
  technicals: "Technical desk & DCA history",
  analysts: "Analyst coverage",
  news: "Company news",
  advanced: "Advanced workbench",
  portfolio: "Portfolio insights",
  home: "Personalized Home",
  ai: "AI analysis",
  longHistory: "Long chart history",
} as const;
export type Feature = keyof typeof featureNames;
export type Rule = "free" | "pro" | "beta" | "off";
export type AccessConfig = {
  mode: "private" | "beta";
  freeResearch: number;
  proResearch: number;
  freeWatchlist: number;
  proWatchlist: number;
  proAi: number;
  rules: Partial<Record<Feature, Rule>>;
};
export const defaultAccessConfig: AccessConfig = {
  mode: "beta",
  freeResearch: 100,
  proResearch: -1,
  freeWatchlist: 5,
  proWatchlist: 50,
  proAi: 10,
  rules: { news: "free" },
};
export function cleanAccessConfig(value: unknown): AccessConfig {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid access settings.");
  const v = value as Record<string, unknown>;
  const allowed = [
    "mode",
    "freeResearch",
    "proResearch",
    "freeWatchlist",
    "proWatchlist",
    "proAi",
    "rules",
  ];
  if (Object.keys(v).some((k) => !allowed.includes(k)))
    throw Error("Unknown access setting.");
  const result = {
    ...defaultAccessConfig,
    rules: { ...defaultAccessConfig.rules },
  };
  if (v.mode !== undefined) {
    if (v.mode !== "private" && v.mode !== "beta")
      throw Error("Choose private or beta mode.");
    result.mode = v.mode;
  }
  for (const k of [
    "freeResearch",
    "proResearch",
    "freeWatchlist",
    "proWatchlist",
    "proAi",
  ] as const) {
    if (k === "proResearch" && v[k] === -1) continue;
  if (v[k] !== undefined) {
    if (
      typeof v[k] !== "number" ||
      !Number.isInteger(v[k]) ||
      v[k] < 0 ||
      v[k] > 1000
    )
      throw Error("Limits must be whole numbers from 0 to 1000.");
    result[k] = v[k];
  }
  }
  if (v.rules !== undefined) {
    if (!v.rules || typeof v.rules !== "object" || Array.isArray(v.rules))
      throw Error("Invalid feature rules.");
    for (const [k, r] of Object.entries(v.rules)) {
      if (
        !Object.hasOwn(featureNames, k) ||
        !["free", "pro", "beta", "off"].includes(String(r))
      )
        throw Error("Invalid feature rule.");
      result.rules[k as Feature] = r as Rule;
    }
  }
  // Permanent public tiers; tolerate legacy stored settings, never reinstate invitation gates.
  result.mode = "beta";
  result.freeResearch = 100;
  result.proResearch = -1;
  return result;
}
type Input = {
  enabled: boolean;
  owner: boolean;
  licensed: boolean;
  now: string;
  preview?: string | null;
  config?: Partial<AccessConfig>;
  grant?: { expiresAt: string; revoked?: boolean } | null;
  subscription?: { status: string; paidUntil: string } | null;
};
export function resolveAccess(i: Input) {
  const config = cleanAccessConfig(i.config ?? {}),
    now = Date.parse(i.now);
  const beta =
    !!i.grant && !i.grant.revoked && Date.parse(i.grant.expiresAt) > now;
  const paid =
    !!i.subscription &&
    ["active", "trialing", "past_due"].includes(i.subscription.status) &&
    Date.parse(i.subscription.paidUntil) > now;
  const preview =
    i.owner && ["free", "pro"].includes(i.preview ?? "")
      ? (i.preview as "free" | "pro")
      : null;
  const plan =
    preview ?? (!i.enabled || i.owner || beta || paid ? "pro" : "free");
  const admitted = true;
  const features = Object.fromEntries(
    (Object.keys(featureNames) as Feature[]).map((k) => {
      const rule = config.rules[k] ?? "pro";
      return [
        k,
        !i.enabled ||
          (i.owner && !preview) ||
          rule === "free" ||
          (rule === "pro" && plan === "pro") ||
          (rule === "beta" && beta),
      ];
    }),
  ) as Record<Feature, boolean>;
  return {
    enabled: i.enabled,
    owner: i.owner,
    preview,
    plan,
    sampleOnly: i.enabled && !i.owner && !i.licensed,
    admitted,
    source:
      i.owner && !preview
        ? "owner"
        : beta
          ? "complimentary"
          : paid
            ? "subscription"
            : !i.enabled
              ? "personal"
              : "free",
    features,
    limits: {
      research: plan === "pro" ? config.proResearch : config.freeResearch,
      watchlist: plan === "pro" ? config.proWatchlist : config.freeWatchlist,
      ai: plan === "pro" ? config.proAi : 0,
    },
    grantUntil: beta ? i.grant!.expiresAt : null,
    paidUntil: paid ? i.subscription!.paidUntil : null,
    billingReady: false as const,
  };
}
export type Access = ReturnType<typeof resolveAccess>;
/** Never return locked raw evidence in an otherwise cached full research payload. */
export function projectResearch<T extends Research>(r: T, a: Access): T {
  if (!a.enabled || (a.owner && !a.preview)) return r;
  const rich =
    a.features.overview ||
    a.features.business ||
    a.features.financials ||
    a.features.value ||
    a.features.advanced;
  const latest = new Map<string, Research["facts"][number]>();
  for (const f of r.facts)
    if (
      ["revenue", "netIncome", "operatingCashFlow", "capex"].includes(
        f.metric,
      ) &&
      (!latest.has(f.metric) || f.end > latest.get(f.metric)!.end)
    )
      latest.set(f.metric, f);
  const e = r.evidence;
  const analyst =
    a.features.analysts ||
    a.features.overview ||
    a.features.value ||
    a.features.advanced;
  const evidence =
    e && (rich || a.features.analysts)
      ? {
          ...e,
          highlights: rich ? e.highlights : {},
          multiples: rich ? e.multiples : {},
          consensus: analyst
            ? e.consensus
            : {
                rating: null,
                target: null,
                low: null,
                high: null,
                strongBuy: null,
                buy: null,
                hold: null,
                sell: null,
                strongSell: null,
              },
          ownership:
            a.features.business || a.features.advanced
              ? e.ownership
              : {
                  outstanding: null,
                  institutions: null,
                  insiders: null,
                  float: null,
                },
          holders: a.features.business || a.features.advanced ? e.holders : [],
          insiders:
            a.features.business || a.features.advanced ? e.insiders : [],
          earnings: rich ? e.earnings : [],
          estimates: rich ? e.estimates : [],
        }
      : undefined;
  const result = {
    ...r,
    history: a.features.longHistory
      ? r.history
      : r.history.slice(a.features.technicals ? -756 : -252),
    facts: rich ? r.facts : [...latest.values()],
    filings: a.features.business ? r.filings : [],
    snapshot: undefined,
    evidence,
  };
  return result as T;
}
