import "server-only";
import { sentisenseFetch } from "./sentisense-provider.server";
import { HttpError, limit } from "./server";
import { readBoundedMarketJson } from "./market-response";
import { companyProductSymbol, companyProducts } from "./company-products";
export async function readCompanyProducts(
  symbol: string,
  {
    key = process.env.SENTISENSE_API_KEY || process.env.SENTISENSE_API_TOKEN,
    fetcher = fetch,
  }: { key?: string; fetcher?: typeof fetch } = {},
) {
  if (!companyProductSymbol(symbol))
    throw new HttpError("Choose a supported company ticker.", 400);
  if (!key) throw new HttpError("Product discovery is not configured.", 503);
  await limit("sentisense:company-products", 20);
  let response: Response;
  try {
    response = await sentisenseFetch(
      `https://app.sentisense.ai/api/v1/stocks/${encodeURIComponent(symbol)}/entities`,
      {
        headers: { "X-SentiSense-API-Key": key, Accept: "application/json" },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
      },
      fetcher,
    );
  } catch {
    throw new HttpError("Company product discovery could not be reached.", 503);
  }
  if (!response.ok)
    throw new HttpError(
      "Company product discovery is unavailable.",
      [401, 403, 404, 429].includes(response.status) ? response.status : 503,
    );
  let raw: unknown;
  try {
    raw = await readBoundedMarketJson(response, 2000000);
  } catch {
    throw new HttpError(
      "Company product response could not be read safely.",
      502,
    );
  }
  const data = companyProducts(raw, symbol);
  if (!data)
    throw new HttpError(
      "Company identity or full product discovery response could not be verified.",
      502,
    );
  return data;
}
