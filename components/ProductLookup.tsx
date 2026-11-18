"use client";
import ProductAppHistory from "./ProductAppHistory";
import { useState } from "react";
import { useResource } from "./Session";
import {
  productQuery,
  type ProductMatch,
  type ProductDetail,
} from "@/lib/product-entities";
import s from "./ProductLookup.module.css";
type Query = { mode: "search" | "detail"; value: string };
type Reply =
  | { mode: "search"; value: string; data: ProductMatch[]; retrievedAt: string }
  | { mode: "detail"; value: string; data: ProductDetail; retrievedAt: string };
export default function ProductLookup() {
  const [input, setInput] = useState("");
  const [request, setRequest] = useState<Query | null>(null);
  const resource = useResource<Reply>(
    request
      ? `product-entities?mode=${request.mode}&value=${encodeURIComponent(request.value)}`
      : null,
    undefined,
    3600000,
  );
  const reply =
    resource.data?.mode === request?.mode &&
    resource.data?.value === request?.value
      ? resource.data
      : null;
  const product = reply?.mode === "detail" ? reply.data : null;
  const value = (n: number | null) =>
    n === null
      ? "Not supplied"
      : n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return (
    <details className={s.root}>
      <summary>Product lookup · makers &amp; conversation</summary>
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
