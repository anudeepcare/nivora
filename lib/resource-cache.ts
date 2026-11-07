export type ResourceCache = Map<string, { at: number; value: unknown }>;
const pending = new WeakMap<ResourceCache, Map<string, Promise<unknown>>>();
export async function readResource<T>(
  cache: ResourceCache,
  key: string,
  ttl: number,
  read: () => Promise<T>,
): Promise<T> {
  const old = cache.get(key);
  if (old && Date.now() - old.at < ttl) {
    cache.delete(key);
    cache.set(key, old);
    return old.value as T;
  }
  let requests = pending.get(cache);
  if (!requests) {
    requests = new Map();
    pending.set(cache, requests);
  }
  const existing = requests.get(key);
  if (existing) return existing as Promise<T>;
  const request = Promise.resolve()
    .then(read)
    .then((data) => {
      if (pending.get(cache) === requests && requests!.get(key) === request) {
        cache.delete(key);
        cache.set(key, { at: Date.now(), value: data });
        if (cache.size > 80) cache.delete(cache.keys().next().value!);
      }
      return data;
    })
    .finally(() => {
      if (requests!.get(key) === request) requests!.delete(key);
    });
  requests.set(key, request);
  return request;
}

export function resourceSnapshot<T>(
  cache: ResourceCache,
  key: string | null,
): T | null {
  return key ? ((cache.get(key)?.value as T) ?? null) : null;
}

/** A refresh starts a new request; late old results cannot replace it. */
export function invalidateResource(cache: ResourceCache, key: string) {
  cache.delete(key);
  pending.get(cache)?.delete(key);
}
/** Discard in-flight writes as well as data when an account leaves. */
export function clearResources(cache: ResourceCache) {
  pending.delete(cache);
  cache.clear();
}
