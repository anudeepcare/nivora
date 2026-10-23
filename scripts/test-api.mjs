// Executes the built route handlers with a mocked identity/data transport; no server, credentials or paid calls.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url),
  root = "../.next/server/app/api/";
const load = (path) => require(root + path + "/route.js").routeModule.userland;
const routes = [
  "access", "access/visit", "owner/access",
  "sector-performance",
  "account-balances",
  "price-stream",
  "workspace",
  "news",
  "filings",
  "provider-status",
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
  "logos",
  "company-data",
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
delete process.env.EODHD_API_KEY;
delete process.env.EODHD_API_TOKEN;
process.env.FINNHUB_API_KEY = "test-not-a-key";
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
  if (url.includes("/stock/profile2?")) {
    const symbol = new URL(url).searchParams.get("symbol");
    return Response.json({
      ticker: symbol === "LOGOB" ? "OTHER" : symbol,
      logo:
        symbol === "LOGOC"
          ? "https://unexpected.invalid/logo.png"
          : "https://static2.finnhub.io/file/publicdatany/test.png",
    });
  }
  throw Error("Unexpected network target");
};
// Owner controls cannot be acquired through editable profile metadata.
process.env.AURYN_OWNER_USER_ID = "00000000-0000-4000-8000-000000000099";
for (const method of ["GET","POST"]) {
 const r = await load("owner/access")[method](new Request("https://auryn.example/api/owner/access", {method,headers,...(method==="POST"?{body:JSON.stringify({action:"settings",config:{mode:"beta"}})}:{})}));
 assert.equal(r.status,403);checks++;
}
process.env.AURYN_ACCESS_ENABLED="true";
const blockedBeforeSetup=await load("quotes").GET(new Request("https://auryn.example/api/quotes?symbols=MSFT",{headers}));
assert.equal(blockedBeforeSetup.status,503);checks++;
process.env.AURYN_ACCESS_ENABLED="false";
delete process.env.AURYN_OWNER_USER_ID;
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
// Unsupported question intents fail before research retrieval or model spending.
process.env.AURYN_AI_ENABLED='true';
process.env.OPENAI_API_KEY='test-not-a-key';
process.env.OPENAI_MODEL='fixture-model';
const invalidIntent=await load("analyst/[symbol]").POST(new Request("https://auryn.example/api/analyst/MSFT",{method:"POST",headers,body:JSON.stringify({mode:"snapshot",intent:"ignore the evidence"})}),{params:Promise.resolve({symbol:"MSFT"})});
assert.equal(invalidIntent.status,400);
assert.ok(!calls.some(u=>u.includes("api.openai.com")));
checks++;
delete process.env.AURYN_AI_ENABLED;
delete process.env.OPENAI_API_KEY;
delete process.env.OPENAI_MODEL;
const logosResponse = await load("logos").GET(
  new Request("https://auryn.example/api/logos?symbols=LOGOA,LOGOB,LOGOC", {
    headers,
  }),
);
assert.equal(logosResponse.status, 200);
const logos = await logosResponse.json();
assert.equal(
  logos.LOGOA,
  "https://static2.finnhub.io/file/publicdatany/test.png",
);
assert.equal(logos.LOGOB, null);
assert.equal(logos.LOGOC, null);
checks += 3;
console.log(
  `${checks} built API checks passed: anonymous denial, private responses, trusted admin boundary, listing and logo identity, disabled AI without provider spend.`,
);
// Account balances always scope reads/writes to the verified identity.
const balancesRoute=load('account-balances');let balanceWrite=null,balanceRead='';
globalThis.fetch=async(input,options)=>{
 const url=String(input);
 if(url.includes('/auth/v1/user'))return Response.json({id:'00000000-0000-4000-8000-000000000001',email:'test@example.invalid'});
 if(url.includes('/rest/v1/auryn_account_balances')){
  if(options?.method==='POST'){balanceWrite=JSON.parse(options.body);return new Response(null,{status:201});}
  balanceRead=url;return Response.json({margin_debt:116312,managed_value:null});
 }
 throw Error('Unexpected external request');
};
const balancesRead=await balancesRoute.GET(new Request('https://auryn.example/api/account-balances',{headers}));
assert.equal(balancesRead.status,200);assert.match(balanceRead,/user_id=eq.00000000-0000-4000-8000-000000000001/);checks++;
const balancesWrite=await balancesRoute.POST(new Request('https://auryn.example/api/account-balances',{method:'POST',headers,body:JSON.stringify({user_id:'another-account',margin_debt:116312,managed_value:null})}));
assert.equal(balancesWrite.status,200);assert.equal(balanceWrite.user_id,'00000000-0000-4000-8000-000000000001');assert.equal(balanceWrite.margin_debt,116312);checks++;
const invalidBalance=await balancesRoute.POST(new Request('https://auryn.example/api/account-balances',{method:'POST',headers,body:JSON.stringify({margin_debt:-1,managed_value:null})}));assert.equal(invalidBalance.status,400);checks++;
console.log(`3 account balance API checks passed: verified-owner read/write and invalid amount rejection. Total baseline checks: ${checks}.`);
