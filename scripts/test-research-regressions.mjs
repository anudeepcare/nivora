// Built-route regressions. Identity and provider transports are fixtures; no paid requests.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const route = (p) =>
  require(`../.next/server/app/api/${p}/route.js`).routeModule.userland;
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://account.example.invalid";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-public";
process.env.TWELVE_DATA_API_KEY = "test-provider";
process.env.SEC_USER_AGENT = "AURYN research-test@test.invalid";
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
delete process.env.AURYN_REQUIRE_DISTRIBUTED_BUDGET;
delete process.env.OPENAI_API_KEY;
delete process.env.OPENAI_MODEL;
process.env.AURYN_AI_ENABLED = "false";
const headers = {
  Authorization: "Bearer fixture",
  "Content-Type": "application/json",
};
const calls = [];
const filing = (form, i) => ({
  form,
  filingDate: "2026-02-01",
  accessionNumber: `0001000184-26-${String(i).padStart(6, "0")}`,
  primaryDocument: `report${i}.htm`,
  primaryDocDescription: form,
});
const submissions = [
  ...Array.from({ length: 30 }, (_, i) => filing("4", i)),
  filing("20-F", 31),
  filing("6-K", 32),
];
const recent = Object.fromEntries(
  Object.keys(submissions[0]).map((k) => [k, submissions.map((r) => r[k])]),
);
const observation = {
  val: 1000,
  start: "2025-01-01",
  end: "2025-12-31",
  filed: "2026-02-01",
  form: "20-F",
  accn: "0001000184-26-000031",
};
globalThis.fetch = async (input, options) => {
  const u = new URL(String(input));
  calls.push(u);
  if (u.pathname === "/auth/v1/user")
    return Response.json({
      id: "00000000-0000-4000-8000-000000000001",
      email_confirmed_at: "2026-01-01",
    });
  if (
    u.pathname === "/rest/v1/portfolio_positions" &&
    options?.method === "PATCH"
  ) {
    assert.equal(
      u.searchParams.get("user_id"),
      "eq.00000000-0000-4000-8000-000000000001",
    );
    assert.equal(u.searchParams.get("currency"), "is.null");
    assert.equal(JSON.parse(options.body).currency, "USD");
    return Response.json([{ id: "00000000-0000-4000-8000-000000000111" }]);
  }
  if (u.pathname === "/rest/v1/rpc/auryn_set_watch") {
    const { p_symbol } = JSON.parse(options.body);
    assert.ok(
      !["BTC", "ETH"].includes(p_symbol),
      "Unwatching crypto must not remove a stock with a similar ticker",
    );
    return Response.json(null);
  }
  if (u.pathname === "/symbol_search")
    return Response.json({
      data: [
        {
          symbol: "SAP",
          instrument_name: "SAP SE",
          currency: "EUR",
          exchange: "XETR",
          country: "Germany",
        },
        {
          symbol: "SAP",
          instrument_name: "SAP SE Sponsored ADR",
          currency: "USD",
          exchange: "NYSE",
          country: "United States",
        },
      ],
    });
  if (u.pathname === "/quote")
    return Response.json({
      symbol: u.searchParams.get("symbol"),
      name: "SAP SE Sponsored ADR",
      exchange: "NYSE",
      currency: "USD",
      close: "200",
      timestamp: u.searchParams.get("symbol")?.includes("/")
        ? Math.floor(Date.now() / 86400000) * 86400
        : Math.floor(Date.now() / 1000),
      previous_close: "180",
      percent_change: "0",
    });
  if (
    u.pathname === "/time_series" &&
    u.searchParams.get("interval") === "1min" &&
    u.searchParams.get("symbol") === "DOGE/USD"
  )
    return new Response("", { status: 503 });
  if (
    u.pathname === "/time_series" &&
    u.searchParams.get("interval") === "1min"
  )
    return Response.json({
      meta: {
        symbol:
          u.searchParams.get("symbol") === "SOL/USD"
            ? "ETH/USD"
            : u.searchParams.get("symbol"),
      },
      values: [
        {
          datetime: new Date(Math.floor(Date.now() / 60000) * 60000 - 60000)
            .toISOString()
            .slice(0, 19)
            .replace("T", " "),
          open: "201",
          high: "203",
          low: "200",
          close: "202",
          volume: "50",
        },
      ],
    });
  if (u.pathname === "/time_series")
    return Response.json({
      meta: {
        symbol: u.searchParams.get("symbol"),
        exchange: "NYSE",
        currency: "USD",
      },
      values: [
        {
          datetime: "2026-10-16",
          open: "199",
          high: "201",
          low: "198",
          close: "200",
          volume: "100",
        },
      ],
    });
  if (u.pathname.endsWith("company_tickers.json"))
    return Response.json({
      0: { ticker: "SAP", cik_str: 1000184, title: "SAP SE" },
      1: { ticker: "NOW", cik_str: 1373715, title: "ServiceNow" },
      2: { ticker: "ASTS", cik_str: 1780312, title: "AST SpaceMobile" },
    });
  if (u.pathname.includes("/submissions/")) {
    if (u.pathname.includes("1780312"))
      return new Response("", { status: 503 });
    return Response.json({ filings: { recent } });
  }
  if (u.pathname.includes("/companyfacts/")) {
    if (u.pathname.includes("1373715"))
      return new Response("", { status: 503 });
    if (u.pathname.includes("1780312"))
      return Response.json({
        entityName: "AST SpaceMobile",
        facts: {
          "us-gaap": {
            RevenueFromContractWithCustomerIncludingAssessedTax: {
              units: { USD: [{ ...observation, form: "10-K", val: 70 }] },
            },
          },
        },
      });
    return Response.json({
      entityName: "SAP SE",
      facts: {
        "ifrs-full": {
          Revenue: { units: { EUR: [observation] } },
          CashFlowsFromUsedInOperatingActivities: {
            units: { EUR: [{ ...observation, val: 200 }] },
          },
        },
      },
    });
  }
  throw Error("Unexpected transport: " + u.hostname + u.pathname);
};
const checks = [];
async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, passed: true });
  } catch (e) {
    checks.push({ name, passed: false, error: e.message });
  }
}
const get = (p, symbol = "SAP") =>
  route(p).GET(
    new Request(`https://test.invalid/api/${p}?q=SAP`, { headers }),
    { params: Promise.resolve({ symbol }) },
  );
await check("SAP search keeps the NYSE USD listing", async () => {
  const r = await get("search");
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.deepEqual(
    d.results.map((x) => [x.symbol, x.exchange, x.currency]),
    [["SAP", "NYSE", "USD"]],
  );
});
const sap = await (await get("research/[symbol]")).json();
await check("SAP research remains usable with IFRS reporting currency", () => {
  assert.equal(sap.company.exchange, "NYSE");
  assert.equal(sap.quote.currency, "USD");
  assert.equal(sap.facts.find((x) => x.metric === "revenue").currency, "EUR");
});
await check(
  "Company reports survive a first page full of insider filings",
  () => {
    assert.deepEqual(
      sap.filings.map((x) => x.form),
      ["20-F", "6-K"],
    );
  },
);
await check(
  "IFRS operating cash flow is retained without inventing capex",
  () => {
    assert.equal(
      sap.facts.find((x) => x.metric === "operatingCashFlow")?.value,
      200,
    );
    assert.equal(
      sap.facts.some((x) => x.metric === "capex"),
      false,
    );
  },
);
await check(
  "A facts outage does not discard available company filings",
  async () => {
    const d = await (await get("research/[symbol]", "NOW")).json();
    assert.equal(d.filings.length, 2);
    assert.equal(d.facts.length, 0);
    assert.ok(d.issues.length);
  },
);
await check(
  "A submissions outage does not discard available financial facts",
  async () => {
    const d = await (await get("research/[symbol]", "ASTS")).json();
    assert.equal(
      d.facts.find((f) => f.metric === "revenue" && f.end === "2025-12-31")
        ?.value,
      70,
    );
    assert.equal(d.filings.length, 0);
    assert.ok(d.issues.length);
  },
);
await check(
  "AI availability is readable before generation and spends no credits",
  async () => {
    const r = await get("analyst/[symbol]");
    assert.equal(r.status, 200);
    const d = await r.json();
    assert.equal(d.available, false);
    assert.equal(d.reason, "disabled");
    assert.ok(!calls.some((u) => u.hostname === "api.openai.com"));
  },
);
await check(
  "Crypto quote uses the timestamp of a completed minute bar",
  async () => {
    const r = await route("quotes").GET(
      new Request(
        "https://test.invalid/api/quotes?symbols=BTC%2FUSD,ETH%2FUSD",
        { headers },
      ),
    );
    const d = await r.json();
    for (const symbol of ["BTC/USD", "ETH/USD"]) {
      assert.equal(d[symbol].quote.price, 202);
      assert.equal(d[symbol].quote.stale, false);
      assert.ok(Date.now() - Date.parse(d[symbol].quote.asOf) < 180000);
    }
  },
);
await check(
  "Cost-currency confirmation updates only selected own rows with no currency",
  async () => {
    const r = await route("workspace").POST(
      new Request("https://test.invalid/api/workspace", {
        method: "POST",
        headers,
        body: JSON.stringify({
          op: "confirm-cost-currency",
          currency: "USD",
          ids: ["00000000-0000-4000-8000-000000000111"],
        }),
      }),
    );
    assert.equal(r.status, 200);
    assert.ok(
      calls.some(
        (u) =>
          u.pathname === "/rest/v1/portfolio_positions" &&
          u.searchParams.has("id"),
      ),
    );
  },
);
await check(
  "Crypto fallback never fabricates freshness on outage or mismatched instrument",
  async () => {
    const r = await route("quotes").GET(
      new Request(
        "https://test.invalid/api/quotes?symbols=DOGE%2FUSD,SOL%2FUSD",
        { headers },
      ),
    );
    const d = await r.json();
    for (const symbol of ["DOGE/USD", "SOL/USD"]) {
      assert.equal(d[symbol].quote.price, 200);
      assert.equal(
        d[symbol].quote.asOf,
        new Date(Math.floor(Date.now() / 86400000) * 86400000).toISOString(),
      );
    }
  },
);
await check(
  "Removing a crypto pair cannot remove the similarly named equity",
  async () => {
    const r = await route("workspace").POST(
      new Request("https://test.invalid/api/workspace", {
        method: "POST",
        headers,
        body: JSON.stringify({ op: "unwatch", symbol: "BTC/USD" }),
      }),
    );
    assert.equal(r.status, 200);
  },
);
await check(
  "Currency confirmation rejects malformed record IDs before database write",
  async () => {
    const before = calls.filter(
      (u) => u.pathname === "/rest/v1/portfolio_positions",
    ).length;
    const r = await route("workspace").POST(
      new Request("https://test.invalid/api/workspace", {
        method: "POST",
        headers,
        body: JSON.stringify({
          op: "confirm-cost-currency",
          currency: "USD",
          ids: ["all"],
        }),
      }),
    );
    assert.equal(r.status, 400);
    assert.equal(
      calls.filter((u) => u.pathname === "/rest/v1/portfolio_positions").length,
      before,
    );
  },
);
await check("One malformed saved ticker does not block SAP, HIMS or OSCR prices", async () => {
  const response = await route("quotes").GET(new Request("https://test.invalid/api/quotes?symbols=SAP,BAD%3F,HIMS,OSCR", { headers }));
  assert.equal(response.status, 200);
  const data = await response.json();
  for (const symbol of ["SAP", "HIMS", "OSCR"]) assert.equal(data[symbol].quote.price, 200);
  assert.equal(typeof data["BAD?"].error, "string");
});
for (const c of checks)
  console.log(
    `${c.passed ? "PASS" : "FAIL"} ${c.name}${c.error ? " — " + c.error : ""}`,
  );
if (checks.some((c) => !c.passed)) process.exitCode = 1;
