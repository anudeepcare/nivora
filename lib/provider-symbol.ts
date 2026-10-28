import { symbolInput } from "./format.ts";

export const US_EXCHANGES = [
  "US",
  "NASDAQ",
  "NYSE",
  "NYSE ARCA",
  "NYSE AMERICAN",
  "AMEX",
  "NYSE MKT",
  "BATS",
  "CBOE",
  "OTCQX",
  "OTCQB",
  "OTCMKTS",
  "OTC",
  "OTCBB",
  "OTCGREY",
  "PINK",
  "NMFQS",
] as const;
const foreignSuffix =
  /\.(?:L|F|TO|V|NE|CN|LSE|XETRA|HK|PA|AS|BR|SW|ST|HE|OL|CO|MI|MC|LS|VI|IR|AT|IS|WAR|AU|AX|NZ|T|TSE|KS|KQ|TW|TWO|SHG|SHE|SS|SZ|NSE|NS|BSE|BO|SA|MX|JO|SG|SI)$/;
const outsideCoverage = () =>
  Object.assign(
    new Error(
      "This exchange-qualified listing is outside supported US/USD equities and USD crypto pairs.",
    ),
    { status: 422 },
  );
/** Validate the supported universe before spending credits. A foreign suffix is
 * never translated into a US class-share dash. Use an explicit .US suffix or US
 * exchange prefix to disambiguate a US class whose letter is an exchange code. */
export function providerSymbol(value: unknown): string {
  let input = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^\$/, "");
  let explicitUS = input.endsWith(".US");
  if (input.includes(":")) {
    const [exchange, code, extra] = input.split(":");
    if (extra || !code)
      throw Object.assign(
        new Error("Enter a valid stock symbol or crypto pair."),
        { status: 400 },
      );
    if (!(US_EXCHANGES as readonly string[]).includes(exchange))
      throw outsideCoverage();
    input = code;
    explicitUS = true;
  }
  if (input.endsWith(".US")) input = input.slice(0, -3);
  if (!explicitUS && foreignSuffix.test(input)) throw outsideCoverage();
  let symbol: string;
  try {
    symbol = symbolInput(input);
  } catch {
    throw Object.assign(
      new Error("Enter a valid stock symbol or crypto pair."),
      { status: 400 },
    );
  }
  if (symbol.includes("/")) {
    if (!/^[A-Z0-9]{2,12}\/USD$/.test(symbol))
      throw Object.assign(new Error("Only USD crypto pairs are supported."), {
        status: 422,
      });
  } else if (!/^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)?$/.test(symbol)) {
    throw Object.assign(
      new Error("Enter a valid stock symbol or crypto pair."),
      { status: 400 },
    );
  } else if (
    !explicitUS &&
    symbol.includes(".") &&
    !/^[A-Z][A-Z0-9]*\.[A-Z]$/.test(symbol)
  ) {
    throw outsideCoverage();
  }
  // Retain established display spelling while route adapters use canonical keys.
  return explicitUS &&
    (foreignSuffix.test(symbol) || /\.[A-Z0-9]{2,}$/.test(symbol))
    ? symbol.replace(".", "-")
    : symbol;
}

/** Only supported US share aliases coalesce; foreign symbols remain distinct. */
export function providerIdentity(value: unknown) {
  const symbol = String(value ?? "")
    .trim()
    .toUpperCase();
  if (foreignSuffix.test(symbol)) return symbol;
  return symbol.replace(/^([A-Z][A-Z0-9]*)\.([A-Z])$/, "$1-$2");
}
export const sameProviderSymbol = (left: unknown, right: string) =>
  providerIdentity(left) === providerIdentity(right);
export const twelveSymbol = (symbol: string) =>
  symbol.includes("/") ? symbol : symbol.replaceAll("-", ".");
