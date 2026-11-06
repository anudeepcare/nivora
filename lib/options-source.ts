import { alpacaOptions } from "./alpaca-options";
import { eodRequest } from "./eodhd";
import { normalizeOptions, type OptionContract } from "./options-analysis";
import { HttpError } from "./server";
/** Reject a source mixing another underlying or inconsistent standard-contract metadata. */
export function validateOptionScope(
  contracts: OptionContract[],
  ticker: string,
  expiry: string | null,
) {
  for (const c of contracts) {
    const m = /^([A-Z.]+)(\d{6})([CP])(\d{8})$/.exec(c.id);
    if (
      m &&
      (m[1] !== ticker ||
        `20${m[2].slice(0, 2)}-${m[2].slice(2, 4)}-${m[2].slice(4, 6)}` !==
          c.expiry ||
        Number(m[4]) / 1000 !== c.strike ||
        (m[3] === "C" ? "call" : "put") !== c.type)
    )
      throw new HttpError(
        "The options source returned inconsistent contract identities.",
        503,
      );
    if ((c.standard && !m) || (expiry && c.expiry !== expiry))
      throw new HttpError(
        "The options source returned contracts outside the requested scope.",
        503,
      );
  }
  return contracts;
}
export async function loadOptionChain(
  ticker: string,
  expiry: string | null = null,
) {
  if (process.env.AURYN_OPTIONS_ENABLED !== "true")
    return {
      status: "unavailable",
      message:
        "Options data is not enabled. The owner can enable it after confirming dataset access and display permissions.",
      contracts: [],
      complete: false,
    };

  if (
    expiry &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      !Number.isFinite(Date.parse(expiry)) ||
      new Date(expiry).toISOString().slice(0, 10) !== expiry)
  )
    throw new HttpError("Choose a valid expiry.");
  if (process.env.AURYN_OPTIONS_PROVIDER !== "eodhd") {
    try {
      const chain = await alpacaOptions(ticker, expiry);
      validateOptionScope(chain.contracts, ticker, expiry);
      return chain;
    } catch (error) {
      throw new HttpError(
        error instanceof Error ? error.message : "Options unavailable.",
        503,
      );
    }
  }
  const rows: unknown[] = [];
  let complete = false,
    total: number | null = null;
  // Bound dataset cost; never follow arbitrary provider links or fetch without an authenticated user.
  for (let page = 0; page < 4; page++) {
    const data = await eodRequest(
      "mp/unicornbay/options/contracts",
      {
        "filter[underlying_symbol]": ticker,
        "filter[exp_date_from]": new Date().toISOString().slice(0, 10),
        ...(expiry
          ? { "filter[exp_date_to]": expiry, "filter[exp_date_from]": expiry }
          : {}),
        "page[limit]": "1000",
        "page[offset]": String(page * 1000),
      },
      900000,
    );
    if (!Array.isArray(data.data))
      throw new HttpError(
        "The options source returned an unsupported response.",
        503,
      );
    rows.push(...data.data);
    total = Number.isFinite(Number(data.meta?.total))
      ? Number(data.meta.total)
      : null;
    complete =
      total !== null
        ? rows.length >= total
        : !data.links?.next && data.data.length < 1000;
    if (complete) break;
  }
  return {
    status: "available",
    contracts: validateOptionScope(normalizeOptions(rows), ticker, expiry),
    complete,
    total,
    fetchedAt: new Date().toISOString(),
    frequency: "End-of-day snapshot; not a live executable quote.",
  };
}
