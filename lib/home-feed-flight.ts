import type { ResourceCache } from "./resource-cache";
type Flight = {
  controller: AbortController;
  users: number;
  promise: Promise<unknown>;
  settled: boolean;
};
const flights = new WeakMap<ResourceCache, Map<string, Flight>>();
/** Public feed work is owned by mounted consumers within one account cache. */
export function acquireHomeFeed<T>(
  cache: ResourceCache,
  key: string,
  ttl: number,
  read: (signal: AbortSignal) => Promise<T>,
) {
  const old = cache.get(key);
  if (old && Date.now() - old.at < ttl)
    return { promise: Promise.resolve(old.value as T), release: () => {} };
  let group = flights.get(cache);
  if (!group) {
    group = new Map();
    flights.set(cache, group);
  }
  let flight = group.get(key);
  if (!flight) {
    const entry: Flight = {
      controller: new AbortController(),
      users: 0,
      promise: Promise.resolve(),
      settled: false,
    };
    entry.promise = Promise.resolve()
      .then(() => {
        entry.controller.signal.throwIfAborted();
        return read(entry.controller.signal);
      })
      .then((value) => {
        if (group!.get(key) === entry && !entry.controller.signal.aborted) {
          cache.delete(key);
          cache.set(key, { at: Date.now(), value });
          if (cache.size > 80) cache.delete(cache.keys().next().value!);
        }
        return value;
      })
      .finally(() => {
        entry.settled = true;
        if (group!.get(key) === entry) group!.delete(key);
      });
    group.set(key, entry);
    flight = entry;
  }
  flight.users++;
  let released = false;
  const current = flight;
  return {
    promise: current.promise as Promise<T>,
    release: () => {
      if (released) return;
      released = true;
      current.users--;
      if (current.users === 0 && !current.settled) {
        if (group!.get(key) === current) group!.delete(key);
        current.controller.abort();
      }
    },
  };
}
/** A refresh detaches old writes, without aborting another mounted consumer. */
export function invalidateHomeFeed(cache: ResourceCache, key: string) {
  cache.delete(key);
  flights.get(cache)?.delete(key);
}
