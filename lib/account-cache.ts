import { clearResources, type ResourceCache } from "./resource-cache.ts";

// Browser memory only. Never retain data across accounts or sign-out.
let active: { owner: string; cache: ResourceCache } | null = null;
export function clearAccountCache() {
  if (active) clearResources(active.cache);
  active = null;
}
export function accountCache(owner: string): ResourceCache {
  if (active?.owner !== owner) {
    clearAccountCache();
    active = { owner, cache: new Map() };
  }
  return active!.cache;
}
