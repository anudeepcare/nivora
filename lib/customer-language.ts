/** Customer-facing wording only. Raw provenance remains attached to server data. */
export function customerText(value: string | null | undefined): string {
  return (value ?? "")
    .replace(
      /https?:\/\/(?:[\w-]+\.)*(?:eodhd\.com|twelvedata\.com)[^\s<>"']*/gi,
      "market data source",
    )
    .replace(/\b(?:eodhd|twelve\s*data)(?:\.com)?\b/gi, "market data");
}
