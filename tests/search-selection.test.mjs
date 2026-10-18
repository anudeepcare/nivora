import test from "node:test";
import assert from "node:assert/strict";
import { supportedListing } from "../lib/market.ts";

test("a USD ADR on NYSE remains supported when the provider reports the issuer country", () => {
  assert.equal(
    supportedListing({ exchange: "NYSE", currency: "USD", country: "Germany" }),
    true,
  );
  assert.equal(
    supportedListing({ exchange: "XETR", currency: "EUR", country: "Germany" }),
    false,
  );
});

test("crypto search defaults to the pair while an explicitly selected ETF remains the ETF", async () => {
  const { searchSelection } = await import("../lib/search-selection.ts");
  const rows = [
    { symbol: "BTC/USD", name: "Bitcoin" },
    { symbol: "BTC", name: "Bitcoin Mini Trust" },
  ];
  assert.equal(searchSelection("btc", rows), "BTC/USD");
  assert.equal(searchSelection("BTC", rows, 1), "BTC");
  assert.equal(searchSelection("ETH", []), "ETH/USD");
  assert.equal(searchSelection("ethereum", []), "ETH/USD");
  assert.equal(searchSelection("$SAP", []), "SAP");
  assert.equal(searchSelection("hims", []), "HIMS");
  assert.equal(searchSelection("oscr", []), "OSCR");
  assert.equal(
    searchSelection("SAP SE", [{ symbol: "SAP", name: "SAP SE" }]),
    "SAP",
  );
});

test("search request keys coalesce case, dollar prefix and whitespace variants", async () => {
  const { searchRequestKey } = await import("../lib/search-selection.ts");
  assert.equal(typeof searchRequestKey, "function");
  assert.equal(searchRequestKey(" $crm "), searchRequestKey("CRM"));
  assert.equal(
    searchRequestKey("  Salesforce   Inc "),
    searchRequestKey("salesforce inc"),
  );
});

test("keyboard result selection scrolls only enough within its list", async () => {
  const { searchListScrollTop } = await import("../lib/search-selection.ts");
  assert.equal(typeof searchListScrollTop, "function");
  assert.equal(searchListScrollTop(100, 200, 500, 240, 290), 100);
  assert.equal(searchListScrollTop(100, 200, 500, 480, 540), 140);
  assert.equal(searchListScrollTop(100, 200, 500, 180, 230), 80);
});
