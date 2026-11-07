"use client";
import HomeMarketCards from "./HomeMarketCards";

import { useState } from "react";
import homeStyles from "./HomeWorkspace.module.css";
import Search from "./Search";
import { useProduct } from "./Session";
import { Empty, Notice } from "./Ui";
import { useWorkspaceQuotes } from "./useWorkspaceQuotes";

import { Heading } from "./WorkspaceShared";
export function ResearchHome() {
  const { workspace, workspaceError, demo } = useProduct(),
    quotes = useWorkspaceQuotes();
  const [page, setPage] = useState(0);
  const prefix = demo && demo.routePrefix !== "" ? "/preview" : "";
  const symbols = [
    ...new Set([
      ...(workspace?.watchlist.map((w) => w.symbol) ?? []),
      ...(workspace?.positions
        .filter((p) => p.assetType !== "cash")
        .map((p) => p.symbol) ?? []),
    ]),
  ];
  const pageCount = Math.max(1, Math.ceil(symbols.length / 4));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleSymbols = symbols.slice(currentPage * 4, currentPage * 4 + 4);
  return (
    <section
      className={`approved-workspace approved-research-home ${homeStyles.research}`}
    >
      <Heading
        title="Research"
        subtitle="Explore companies. Compare the evidence."
      />
      <section className="card approved-research-search">
        <h2>Find a company</h2>
        <Search large />
      </section>
      {workspaceError && <Notice error>{workspaceError}</Notice>}
      {quotes.error && <p className="approved-data-note">{quotes.error}</p>}
      {symbols.length ? (
        <>
          <HomeMarketCards
            symbols={visibleSymbols}
            quotes={quotes.data}
            research={[]}
            prefix={prefix}
            context="research"
            total={symbols.length}
          />
          {pageCount > 1 && (
            <nav
              className={homeStyles.researchPaging}
              aria-label="Saved company pages"
            >
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span aria-live="polite">
                {currentPage * 4 + 1}–
                {Math.min((currentPage + 1) * 4, symbols.length)} of{" "}
                {symbols.length}
              </span>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage + 1 >= pageCount}
              >
                Next
              </button>
            </nav>
          )}
        </>
      ) : (
        <section className="card">
          <Empty title="Start with a company you care about">
            Search above. Save a company to keep its business, price and
            evidence within reach.
          </Empty>
        </section>
      )}
    </section>
  );
}
