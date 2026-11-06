// Execute the real TypeScript provider graph; only the external HTTP transport is replaced.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
export function sourceModule(relative) {
  const modules = new Map();
  function load(filename) {
    filename = path.resolve(filename);
    if (!path.extname(filename)) filename += ".ts";
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) =>
      name.startsWith("@/")
        ? load(path.resolve(name.slice(2)))
        : name.startsWith(".")
          ? load(path.resolve(path.dirname(filename), name))
          : require(name);
    new Function("require", "module", "exports", code)(
      localRequire,
      module,
      module.exports,
    );
    return module.exports;
  }
  return load(relative);
}
export function fixtureProviders(
  handler,
  { eodhd = true, twelve = true } = {},
) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fixture.invalid";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "fixture-public";
  process.env.SEC_USER_AGENT = "AURYN tests@test.invalid";
  if (eodhd) process.env.EODHD_API_KEY = "fixture-eod";
  else delete process.env.EODHD_API_KEY;
  delete process.env.EODHD_API_TOKEN;
  if (twelve) process.env.TWELVE_DATA_API_KEY = "fixture-twelve";
  else delete process.env.TWELVE_DATA_API_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.AURYN_REQUIRE_DISTRIBUTED_BUDGET;
  delete process.env.AURYN_SHARED_MARKET_GUARD;
  const calls = [];
  globalThis.fetch = async (input, options) => {
    const url = new URL(String(input));
    calls.push(url);
    return handler(url, options);
  };
  return { ...sourceModule("lib/providers.ts"), calls };
}
export const bar = {
  date: "2026-10-23",
  datetime: "2026-10-23",
  open: 100,
  high: 103,
  low: 99,
  close: 102,
  volume: 1000,
};
export function marketResponse(url, options = {}) {
  const symbol =
    url.searchParams.get("symbol") ||
    url.pathname.split("/").at(-1).replace(/\.US$/, "");
  if (url.pathname.includes("/real-time/"))
    return Response.json({
      code: url.pathname.split("/").at(-1),
      close: 102,
      timestamp: Math.floor(Date.now() / 1000),
    });
  if (url.pathname.includes("/fundamentals/"))
    return Response.json({
      General: {
        Code: symbol,
        Name: "Verified " + symbol,
        Exchange: "NYSE",
        CurrencyCode: "USD",
        CountryISO: "US",
      },
    });
  if (url.pathname.includes("/eod/")) return Response.json([bar]);
  if (url.pathname.includes("/splits/")) return Response.json([]);
  if (url.pathname === "/quote")
    return Response.json({
      symbol,
      name: "Verified " + symbol,
      exchange: "NYSE",
      currency: "USD",
      close: "103",
      timestamp: Math.floor(Date.now() / 1000),
    });
  if (url.pathname === "/time_series")
    return Response.json({
      meta: { symbol, currency: "USD", exchange: "NYSE" },
      values: [bar],
    });
  if (url.pathname.endsWith("company_tickers.json")) return Response.json({});
  if (url.pathname === "/profile")
    return Response.json({
      symbol,
      name: "Verified " + symbol,
      currency: "USD",
      exchange: "NYSE",
    });
  throw Error("Unexpected fixture transport " + url.hostname + url.pathname);
}
