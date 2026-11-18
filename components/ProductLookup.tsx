"use client";
import type { CompanyProducts } from "@/lib/company-products";
import ProductAppHistory from "./ProductAppHistory";
import { useState } from "react";
import { useResource } from "./Session";
import {
  productQuery,
  type ProductMatch,
  type ProductDetail,
} from "@/lib/product-entities";
import s from "./ProductLookup.module.css";
type Query = { mode: "search" | "detail" | "company"; value: string };
type Reply =
  | {
      mode: "company";
      value: string;
      data: CompanyProducts;
      retrievedAt: string;
    }
  | { mode: "search"; value: string; data: ProductMatch[]; retrievedAt: string }
  | { mode: "detail"; value: string; data: ProductDetail; retrievedAt: string };
export default function ProductLookup({
  companySymbol,
}: { companySymbol?: string } = {}) {
  const [input, setInput] = useState("");
  const [request, setRequest] = useState<Query | null>(null);
  const resource = useResource<Reply | CompanyProducts>(
    request
      ? request.mode === "company"
        ? `company-products?symbol=${encodeURIComponent(request.value)}`
        : `product-entities?mode=${request.mode}&value=${encodeURIComponent(request.value)}`
      : null,
    undefined,
    3600000,
  );
  const received = resource.data;
  const reply: Reply | null =
    request?.mode === "company" &&
    received &&
    "symbol" in received &&
    received.symbol === request.value &&
    received.symbol === companySymbol
      ? {
          mode: "company",
          value: received.symbol,
          data: received,
          retrievedAt: received.retrievedAt,
        }
      : received &&
          "mode" in received &&
          received.mode === request?.mode &&
          received.value === request?.value
        ? received
        : null;
  const product = reply?.mode === "detail" ? reply.data : null;
  const value = (n: number | null) =>
    n === null
      ? "Not supplied"
      : n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return (
    <details className={s.root}>
      <summary>
        {companySymbol
          ? `${companySymbol} · linked products & apps`
          : "Product lookup · makers & conversation"}
      </summary>
      {companySymbol && (
        <>
          <button
            type="button"
            disabled={resource.loading}
            onClick={() =>
              setRequest({ mode: "company", value: companySymbol })
            }
          >
            Load linked products
          </button>
          <p>
            Provider-curated associations, not ownership or a complete product
            catalog. App tracking does not establish usage or revenue.
          </p>
        </>
      )}
      <p>
        Research a known product by name. Products are not tickers; a maker or
        associated company is a separate entity. Enter public product names
        only, not personal or account information.
      </p>
      <form
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          const q = productQuery(input);
          if (q) setRequest({ mode: "search", value: q });
        }}
      >
        <label>
          Product name
          <input
            type="search"
            value={input}
            maxLength={80}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. ChatGPT or GeForce"
          />
        </label>
        <button
          type="submit"
          disabled={!productQuery(input) || resource.loading}
        >
          Find products
        </button>
      </form>
      {!request ? (
        <p>No search runs until you submit a name.</p>
      ) : resource.loading ? (
        <p role="status">Loading product evidence…</p>
      ) : resource.error ? (
        <div role="status">
          <p>{resource.error}</p>
          <button type="button" onClick={() => resource.refresh()}>
            Retry lookup
          </button>
        </div>
      ) : reply?.mode === "company" ? (
        <>
          <p>
            {reply.data.products.length} matching products among{" "}
            {reply.data.returnedEntities} returned related entities. Source
            observation date is not supplied.
          </p>
          <ul className={s.matches}>
            {reply.data.products.map((item) => (
              <li key={item.handle}>
                <button
                  type="button"
                  onClick={() =>
                    setRequest({ mode: "detail", value: item.handle })
                  }
                >
                  {item.name}
                </button>
                <span>
                  {item.trackedApp ? "Tracked iOS app" : "Product"} ·{" "}
                  {item.handle}
                </span>
              </li>
            ))}
          </ul>
          {!reply.data.products.length && (
            <p>
              No matching products were returned in this limited relationship
              sample. This does not mean the company has no products.
            </p>
          )}
          {reply.data.omittedHandles > 0 && (
            <p>
              {reply.data.omittedHandles} product records lacked a public handle
              and cannot be opened.
            </p>
          )}
          {reply.data.truncated && (
            <p>Showing the first 50 returned product matches, not a ranking.</p>
          )}
          <button type="button" onClick={() => resource.refresh()}>
            Refresh linked products
          </button>
          <details data-info-disclosure>
            <summary>Source &amp; coverage</summary>
            <p>
              SentiSense entity relationships for {reply.data.symbol}. Retrieved{" "}
              {new Date(reply.retrievedAt).toLocaleString()}. Session reuse is
              one hour; this is not a product observation date. Only exact
              associated-ticker matches are shown. Selecting a product loads its
              verified public handle; history stays opt-in.
            </p>
          </details>
        </>
      ) : reply?.mode === "search" ? (
        <>
          <p>
            {reply.data.length} matches returned, up to 10. This is a name
            lookup, not a product popularity ranking.
          </p>
          <ul className={s.matches}>
            {reply.data.map((item) => (
              <li key={item.handle}>
                <button
                  type="button"
                  onClick={() =>
                    setRequest({ mode: "detail", value: item.handle })
                  }
                >
                  {item.name}
                </button>
                <span>Product · {item.handle}</span>
              </li>
            ))}
          </ul>
          {!reply.data.length && (
            <p>
              No matching tracked products. This does not establish that a
              product does not exist.
            </p>
          )}
        </>
      ) : product ? (
        <article>
          <header className={s.header}>
            <div>
              <h3>{product.name}</h3>
              <p>
                Product
                {product.category
                  ? ` · ${product.category.replaceAll("_", " ")}`
                  : ""}
              </p>
            </div>
            <button type="button" onClick={() => resource.refresh()}>
              Refresh product
            </button>
          </header>
          {product.description && <p>{product.description}</p>}
          {product.about && product.about !== product.description && (
            <p>{product.about}</p>
          )}
          <dl className={s.facts}>
            {[
              ["Maker", product.maker],
              ["Product family", product.family],
            ].map(([label, ref]) => {
              const r = typeof ref === "object" ? ref : null;
              return (
                <div key={String(label)}>
                  <dt>{String(label)}</dt>
                  <dd>
                    {r ? r.name : "Not supplied"}
                    {r?.listingCoverage
                      ? ` · ${r.listingCoverage.replaceAll("_", " ")}`
                      : ""}
                    {r?.listing ? ` · ${r.listing}` : ""}
                    {r?.ticker ? (
                      <>
                        <br />
                        <a href={`/research/${encodeURIComponent(r.ticker)}`}>
                          Research maker {r.ticker} ↗
                        </a>
                      </>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
          <h4>Conversation · 7-day averages</h4>
          <p>
            Observation dates are not supplied by this endpoint. Retrieval time
            does not establish freshness. Each measure has a different scale.
          </p>
          <dl className={s.metrics}>
            <div>
              <dt>Sentiment polarity · −1 to +1</dt>
              <dd>{value(product.metrics.sentiment)}</dd>
            </div>
            <div>
              <dt>Mentions · 7-day average</dt>
              <dd>{value(product.metrics.mentions)}</dd>
            </div>
            <div>
              <dt>Sentiment Score · open-ended</dt>
              <dd>{value(product.metrics.score)}</dd>
            </div>
          </dl>
          <p>
            These describe product conversation, not revenue, adoption, market
            share, an investment Rating or expected returns.
          </p>
          <ProductAppHistory key={product.handle} handle={product.handle} />
          <details data-info-disclosure>
            <summary>Source &amp; identifiers</summary>
            <p>
              Source: SentiSense entity knowledge graph and seven-day metric
              summaries. Public product handle: {product.handle}. Internal KB
              IDs and associated tickers are not used as product identity.
            </p>
            <p>
              Fetched{" "}
              {reply?.retrievedAt
                ? new Date(reply.retrievedAt).toLocaleString()
                : "time unavailable"}
              . Session reuse lasts one hour; an open view may be older. No
              observation timestamp is inferred.
            </p>
          </details>
        </article>
      ) : null}
    </details>
  );
}
