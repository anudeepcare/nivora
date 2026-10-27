import type { Metadata } from "next";
export const SITE_URL = "https://www.auryninvest.com";
export const SUPPORT_EMAIL = "support@auryninvest.com";
export const publicPages: Record<
  string,
  { title: string; description: string }
> = {
  "/": {
    title: "AURYN · Clearer stock research. A better next move.",
    description:
      "Understand the business, test the price and plan your next contribution with AURYN Pace. Stock research, watchlists and portfolio context in one place.",
  },
  "/sample": {
    title: "See AURYN in action · Product tour",
    description:
      "Explore a labelled example of AURYN stock research, business metrics and contribution Pace before creating an account.",
  },
  "/pricing": {
    title: "AURYN plans · Free and Pro",
    description:
      "Compare AURYN Free and Pro research tools, portfolio features and membership options.",
  },
  "/about": {
    title: "About AURYN · Investment research with context",
    description:
      "Learn how AURYN connects business evidence, valuation, funding and price context into understandable research.",
  },
  "/pace": {
    title: "AURYN Pace explained · P0 to P4",
    description:
      "Understand AURYN’s contribution scale, confirmed and forming readings, and how Pace works with Buy, Add, Hold and Wait.",
  },
  "/help": {
    title: "AURYN help · Research, accounts and Pace",
    description:
      "Find answers about stock search, research, portfolios, account access and AURYN Pace.",
  },
  "/contact": {
    title: "Contact AURYN · Support and feedback",
    description:
      "Contact support@auryninvest.com for account, research, billing or privacy questions, or submit a support request.",
  },
  "/methodology": {
    title: "AURYN methodology · Inputs, models and decisions",
    description:
      "Review AURYN’s disclosed research rules, valuation assumptions, contribution policy and data limitations.",
  },
  "/terms": {
    title: "AURYN terms of service",
    description:
      "Terms for using AURYN research tools and membership services.",
  },
  "/privacy": {
    title: "AURYN privacy · Your data and choices",
    description:
      "Understand account data, support requests and optional analytics, and manage your privacy choices.",
  },
  "/risk": {
    title: "AURYN risk disclosure",
    description:
      "Understand investment risk, model assumptions and the limits of research tools.",
  },
  "/reliability": {
    title: "AURYN reliability · Coverage and release checks",
    description:
      "Read about research freshness, model coverage and the scope of release verification.",
  },
};
export const publicPaths = Object.keys(publicPages);
export function routeMetadata(path: string): Metadata {
  const page = publicPages[path];
  if (!page)
    return {
      title: "AURYN · Your workspace",
      robots: { index: false, follow: false },
      alternates: { canonical: undefined },
      openGraph: {
        title: "AURYN",
        description: "Your investment research workspace.",
      },
    };
  const url = SITE_URL + path;
  return {
    ...page,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      ...page,
      url,
      siteName: "AURYN",
      type: "website",
      images: [
        {
          url: SITE_URL + "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "AURYN — Understand the business. Put the price in perspective.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      ...page,
      images: [SITE_URL + "/opengraph-image"],
    },
  };
}
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AURYN",
  url: SITE_URL,
  logo: SITE_URL + "/icon.svg",
  email: SUPPORT_EMAIL,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: SUPPORT_EMAIL,
  },
};
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AURYN",
  url: SITE_URL,
  description: publicPages["/"].description,
};
