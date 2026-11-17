"use client";
import "@/app/core/compatibility.css";
import type { DocumentId } from "@/lib/legal-content";
import { ProductSession, useProduct, type DemoData } from "./Session";
import Shell from "./Shell";
import { symbolInput } from "@/lib/format";
import dynamic from "next/dynamic";
import LaunchScreen, { PageSkeleton } from "./LaunchScreen";
// Load secondary workspaces only when selected; keep account/session state above them.
const opening = () => <PageSkeleton />;
const ReleaseNotes = dynamic(() => import("./ReleaseNotes"), {
  loading: opening,
});
const Plans = dynamic(() => import("./Plans"), { loading: opening });
const MonthlyPlan = dynamic(() => import("./MonthlyPlan"), {
  loading: opening,
});
const OwnerAccess = dynamic(() => import("./OwnerAccess"), {
  loading: opening,
});
const Trading = dynamic(() => import("./Trading"), { loading: opening });
const LegalDocument = dynamic(() => import("./LegalDocument"), {
  loading: opening,
});
const ResearchLab = dynamic(() => import("./ResearchLab"), {
  loading: opening,
});
const Alerts = dynamic(() => import("./AlertCenter"), { loading: opening });
const Discover = dynamic(() => import("./Discover"), { loading: opening });
const PasswordRecovery = dynamic(() => import("./PasswordRecovery"), {
  loading: opening,
});
const Research = dynamic(() => import("./Research"), {
  loading: () => <PageSkeleton page="research" />,
});
const Overview = dynamic(
  () => import("./HomeWorkspace").then((m) => m.Overview),
  { loading: opening },
);
const Portfolio = dynamic(
  () => import("./PortfolioPage").then((m) => m.Portfolio),
  { loading: () => <PageSkeleton page="portfolio" /> },
);
const Watchlist = dynamic(
  () => import("./WatchlistPage").then((m) => m.Watchlist),
  { loading: () => <PageSkeleton page="watchlist" /> },
);
const ResearchHome = dynamic(
  () => import("./ResearchHomePage").then((m) => m.ResearchHome),
  { loading: opening },
);
const Settings = dynamic(
  () => import("./SupportingViews").then((m) => m.Settings),
  { loading: opening },
);
const Compare = dynamic(
  () => import("./SupportingViews").then((m) => m.Compare),
  { loading: opening },
);
const HelpPage = dynamic(
  () => import("./SupportingViews").then((m) => m.HelpPage),
  { loading: opening },
);
function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { workspace, workspaceError, reloadWorkspace } = useProduct();
  if (!workspace)
    return (
      <LaunchScreen
        error={workspaceError || undefined}
        onRetry={() => void reloadWorkspace()}
      />
    );
  return children;
}
export default function Product({
  route,
  demo,
  compareSymbols,
}: {
  route: string[];
  demo?: DemoData;
  compareSymbols?: string;
}) {
  const page = route[0] || "overview";
  if (page === "changelog") return <ReleaseNotes />;
  if (page === "reset-password") return <PasswordRecovery />;
  if (
    ["terms", "privacy", "risk", "methodology", "help", "reliability"].includes(
      page,
    )
  )
    return <LegalDocument id={page as DocumentId} />;
  // Only the localhost-only design preview owns a page-level session.
  // Real account sessions are retained by AppSession in the root layout.
  const frame = (content: React.ReactNode) =>
    demo ? (
      <ProductSession demo={demo}>
        <Shell page={page}>{content}</Shell>
      </ProductSession>
    ) : (
      <>{content}</>
    );
  let researchSymbol = "";
  if (page === "research" && route[1]) {
    try {
      researchSymbol = symbolInput(
        decodeURIComponent(route.slice(1).join("/")),
      );
    } catch {
      return frame(
        <p role="alert">
          This instrument link is invalid. Search for the company or crypto pair
          again.
        </p>,
      );
    }
  }
  return frame(
    page === "monthly-plan" ? (
      <MonthlyPlan />
    ) : page === "research" ? (
      route[1] ? (
        <Research key={researchSymbol} symbol={researchSymbol} />
      ) : (
        <WorkspaceGate>
          <ResearchHome />
        </WorkspaceGate>
      )
    ) : page === "portfolio" ? (
      <WorkspaceGate>
        <Portfolio />
      </WorkspaceGate>
    ) : page === "watchlist" ? (
      <WorkspaceGate>
        <Watchlist />
      </WorkspaceGate>
    ) : page === "plans" ? (
      <Plans />
    ) : page === "owner" ? (
      <OwnerAccess />
    ) : page === "settings" ? (
      <Settings />
    ) : page === "compare" ? (
      <Compare initialSymbols={compareSymbols} />
    ) : page === "alerts" ? (
      <Alerts />
    ) : page === "research-lab" ? (
      <ResearchLab />
    ) : page === "trading" ? (
      <Trading />
    ) : page === "discover" ? (
      <Discover />
    ) : page === "help" ? (
      <HelpPage />
    ) : (
      <WorkspaceGate>
        <Overview />
      </WorkspaceGate>
    ),
  );
}
