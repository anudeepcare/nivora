"use client";
import { api } from "./client";
import { safeLogoUrl } from "./logo-policy";
const resolved = new Map<string, { url: string | null; expires: number }>();
const queued = new Map<string, ((url: string | null) => void)[]>();
let timer: ReturnType<typeof setTimeout> | null = null;
async function flush() {
  timer = null;
  const entries = [...queued.entries()].slice(0, 20);
  entries.forEach(([s]) => queued.delete(s));
  try {
    const result = await api<Record<string, string | null>>(
      `logos?symbols=${encodeURIComponent(entries.map(([s]) => s).join(","))}`,
    );
    for (const [symbol, listeners] of entries) {
      const url = safeLogoUrl(result[symbol]);
      resolved.set(symbol, {
        url,
        expires: Date.now() + (url ? 86400000 : 300000),
      });
      listeners.forEach((fn) => fn(url));
    }
  } catch {
    for (const [symbol, listeners] of entries) {
      resolved.set(symbol, { url: null, expires: Date.now() + 300000 });
      listeners.forEach((fn) => fn(null));
    }
  }
  if (resolved.size > 500) resolved.delete(resolved.keys().next().value!);
  if (queued.size && !timer) timer = setTimeout(flush, 100);
}
export function requestLogo(symbol: string): Promise<string | null> {
  const old = resolved.get(symbol);
  if (old && old.expires > Date.now()) return Promise.resolve(old.url);
  return new Promise((resolve) => {
    queued.set(symbol, [...(queued.get(symbol) || []), resolve]);
    if (!timer) timer = setTimeout(flush, 80);
  });
}
