"use client";
import Trading from "./Trading";
import ResearchLab from "./ResearchLab";
import Alerts from "./AlertCenter";
import Discover from "./Discover";
import { ProductSession, type DemoData } from "./Session";
import Shell from "./Shell";
import { symbolInput } from "@/lib/format";
import dynamic from "next/dynamic";
const Research = dynamic(() => import("./Research"), {
  loading: () => <p role="status">Opening research…</p>,
});
import { Overview, ResearchHome, Portfolio, Watchlist } from "./Workspace";
import { Settings, Compare, HelpPage } from "./SupportingViews";
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
  let researchSymbol = "";
  if (page === "research" && route[1]) {
    try {
      researchSymbol = symbolInput(
        decodeURIComponent(route.slice(1).join("/")),
      );
    } catch {
      return (
        <ProductSession demo={demo}>
          <Shell page={page}>
            <p role="alert">
              This instrument link is invalid. Search for the company or crypto
              pair again.
            </p>
          </Shell>
        </ProductSession>
      );
    }
  }
  return (
    <ProductSession demo={demo}>
      <Shell page={page}>
        {page === "research" ? (
          route[1] ? (
            <Research key={researchSymbol} symbol={researchSymbol} />
          ) : (
            <ResearchHome />
          )
        ) : page === "portfolio" ? (
          <Portfolio />
        ) : page === "watchlist" ? (
          <Watchlist />
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
          <Overview />
        )}
      </Shell>
    </ProductSession>
  );
}
