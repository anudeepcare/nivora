import type { FlowReply } from "./options-flow";
export async function loadOptionsFlow(
  _symbol: string,
  _expiry: string | null = null,
): Promise<FlowReply> {
  return {
    status: "unavailable",
    message:
      "Trade-level options tape is not available from the configured EODHD and SentiSense integration. No synthetic trades are shown.",
    trades: [],
    contracts: [],
    partial: true,
    source: "EODHD / SentiSense",
  };
}
