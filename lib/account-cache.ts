import type { ResourceCache } from "./resource-cache";

// Browser memory only. Never retain data across accounts or sign-out.
let active: { owner: string; cache: ResourceCache } | null = null;
export function clearAccountCache() {
  active?.cache.clear();
  active = null;
}
export function accountCache(owner: string): ResourceCache {
  if (active?.owner !== owner) {
    clearAccountCache();
    active = { owner, cache: new Map() };
  }
  return active!.cache;
}
