"use client";
import Trading from "./Trading";
import LegalDocument from "./LegalDocument";
import type {DocumentId} from "@/lib/legal-content";
import ResearchLab from "./ResearchLab";
import Alerts from "./AlertCenter";
import Discover from "./Discover";
import { ProductSession, useProduct, type DemoData } from "./Session";
import Shell from "./Shell";
import { symbolInput } from "@/lib/format";
import dynamic from "next/dynamic";
const Research = dynamic(() => import("./Research"), {
  loading: () => (
    <p role="status" aria-busy="true">
      Opening research…
    </p>
  ),
});
import { Overview, ResearchHome, Portfolio, Watchlist } from "./Workspace";
import { Settings, Compare, HelpPage } from "./SupportingViews";
function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { workspace, workspaceError, reloadWorkspace } = useProduct();
  if (!workspace)
    return (
      <section
        className="workspace-loading"
        aria-busy={!workspaceError}
        role="status"
      >
        <span className={workspaceError ? "" : "spinner"} />
        <h2>
          {workspaceError
            ? "Your workspace could not be loaded"
            : "Loading your investments"}
        </h2>
        <p>
          {workspaceError || "Retrieving your saved positions and watchlist…"}
        </p>
        {workspaceError && (
          <button className="button" onClick={reloadWorkspace}>
            Try again
          </button>
        )}
      </section>
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
  if (["terms","privacy","risk","methodology","help","reliability"].includes(page)) return <LegalDocument id={page as DocumentId}/>;
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
    page === "research" ? (
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
