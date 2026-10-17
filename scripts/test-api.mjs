// Executes the built route handlers with a mocked identity/data transport; no server, credentials or paid calls.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  root = "../.next/server/app/api/";
const load = (path) => require(root + path + "/route.js").routeModule.userland;
const routes = [
  "workspace",
  "documents",
  "alerts",
  "observations",
  "portfolio-import",
  "paper-plans",
  "enrichment/[symbol]",
  "jobs",
  "search",
  "research/[symbol]",
  "chart/[symbol]",
  "quotes",
  "paper-status",
  "analyst/[symbol]",
];
let checks = 0,
  calls = [];
globalThis.fetch = async () => {
  throw Error("Unauthenticated request must not contact a provider");
};
for (const path of routes) {
  const route = load(path);
  for (const method of ["GET", "POST"])
    if (route[method]) {
      const r = await route[method](
        new Request("https://auryn.example/api/test", { method }),
        { params: Promise.resolve({ symbol: "MSFT" }) },
      );
      assert.equal(r.status, 401, path);
      assert.match(r.headers.get("cache-control"), /no-store/);
      checks++;
    }
}
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://account.example.invalid";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable";
process.env.TWELVE_DATA_API_KEY = "test-not-a-key";
const headers = {
  Authorization: "Bearer test-only",
  "Content-Type": "application/json",
};
globalThis.fetch = async (input, options) => {
  const url = String(input);
  calls.push(url);
  if (url.includes("/auth/v1/user"))
    return Response.json({
      id: "00000000-0000-4000-8000-000000000001",
      email: "test@example.invalid",
      email_confirmed_at: "2026-01-01",
      app_metadata: {},
      user_metadata: { role: "admin" },
    });
  if (url.includes("/symbol_search?"))
    return Response.json({
      data: [
        {
          symbol: "ABC",
          exchange: "LSE",
          country: "United Kingdom",
          currency: "GBP",
          instrument_name: "Wrong foreign listing",
        },
        {
          symbol: "MSFT",
          exchange: "NASDAQ",
          country: "United States",
          currency: "USD",
          instrument_name: "Microsoft",
        },
      ],
    });
  throw Error("Unexpected network target");
};
const denied = await load("paper-status").GET(
  new Request("https://auryn.example/api/paper-status", { headers }),
);
assert.equal(denied.status, 403);
checks++;
const deniedPlan = await load("paper-plans").POST(
  new Request("https://auryn.example/api/paper-plans", {
    method: "POST",
    headers,
    body: JSON.stringify({
      op: "run",
      id: "00000000-0000-4000-8000-000000000009",
    }),
  }),
);
assert.equal(deniedPlan.status, 403);
assert.ok(!calls.some((u) => u.includes("alpaca.markets")));
checks++;
const found = await load("search").GET(
  new Request("https://auryn.example/api/search?q=Micro", { headers }),
);
assert.equal(found.status, 200);
const payload = await found.json();
assert.deepEqual(
  payload.results.map((x) => x.symbol),
  ["MSFT"],
);
checks++;
const ai = await load("analyst/[symbol]").POST(
  new Request("https://auryn.example/api/analyst/MSFT", {
    method: "POST",
    headers,
    body: JSON.stringify({ mode: "snapshot" }),
  }),
  { params: Promise.resolve({ symbol: "MSFT" }) },
);
assert.equal(ai.status, 503);
assert.ok(!calls.some((u) => u.includes("api.openai.com")));
checks++;
console.log(
  `${checks} built API checks passed: anonymous denial, private responses, trusted admin boundary, listing identity, disabled AI without provider spend.`,
);
