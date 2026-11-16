/** Explicit rollout. Sole-source mode never silently calls another data vendor. */
export function isSentiSenseMarket(env = process.env) {
  return env.AURYN_MARKET_PROVIDER === "sentisense";
}

/** User-selected price source, including split-adjusted history; never enables legacy fundamentals. */
export function isEodLiveQuotes(env = process.env) {
  return isSentiSenseMarket(env) && env.AURYN_PRICE_PROVIDER === "eodhd";
}
