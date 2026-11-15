/** Operational UI wording only, never contractual attribution or publisher credits.
 * Raw provenance remains attached to server data; license credits are separate. */
export function customerText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(
      /https?:\/\/(?:[\w-]+\.)*(?:eodhd\.com|eodhistoricaldata\.com|twelvedata\.com|sentisense\.ai|eulerpool\.com|financialmodelingprep\.com|alphavantage\.co)[^\s<>"']*/gi,
      "market data source",
    )
    .replace(
      /\b(?:eodhd|eod\s+historical\s+data|twelve\s*data|sentisense|eulerpool|financial\s+modeling\s+prep|alpha\s+vantage)(?:\.com)?\b/gi,
      "market data",
    );
}
