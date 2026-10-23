/** Bounded entitlement fallback. Never retry timeouts or rate limits as a second request. */
export async function readExtendedQuote<T>(
  read: (endpoint: string, params: Record<string,string>) => Promise<T>,
  symbol: string,
  capability: {deniedUntil: number},
  now = Date.now(),
): Promise<T> {
  if (symbol.includes('/') || capability.deniedUntil > now)
    return read('quote', {symbol});
  try {
    return await read('quote', {symbol, prepost: 'true'});
  } catch (error) {
    if (!(error && typeof error === 'object' && 'entitlementDenied' in error && error.entitlementDenied === true)) throw error;
    capability.deniedUntil = now + 3600_000;
    return read('quote', {symbol});
  }
}
