import {
  readResource,
  invalidateResource,
  type ResourceCache,
} from "./resource-cache.ts";
import { loadPortfolioCalendar } from "./portfolio-calendar.ts";
import type { HomeFeed } from "./home-feed";
type Calendar = Awaited<ReturnType<typeof loadPortfolioCalendar>>;
type Entry = {
  controller: AbortController;
  promise: Promise<Calendar>;
  users: number;
  settled: boolean;
};
const pending = new WeakMap<ResourceCache, Map<string, Entry>>();
function wait<T>(promise: Promise<T>, signal: AbortSignal) {
  return new Promise<T>((resolve, reject) => {
    const stop = () => {
      signal.removeEventListener("abort", stop);
      reject(Error("Calendar request cancelled."));
    };
    if (signal.aborted) {
      void promise.catch(() => {});
      stop();
      return;
    }
    signal.addEventListener("abort", stop, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", stop);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", stop);
        reject(error);
      },
    );
  });
}
export function invalidatePortfolioCalendar(cache: ResourceCache, key: string) {
  pending.get(cache)?.delete(key);
  invalidateResource(cache, key);
}
export async function readPortfolioCalendar(
  cache: ResourceCache,
  key: string,
  symbols: string[],
  read: (batch: string[], signal: AbortSignal) => Promise<HomeFeed>,
  signal?: AbortSignal,
) {
  if (signal?.aborted) throw Error("Calendar request cancelled.");
  let requests = pending.get(cache);
  if (!requests) {
    requests = new Map();
    pending.set(cache, requests);
  }
  let entry = requests.get(key);
  if (!entry) {
    const controller = new AbortController();
    entry = {
      controller,
      promise: Promise.resolve(null as unknown as Calendar),
      users: 0,
      settled: false,
    };
    const current = entry;
    current.promise = readResource<Calendar>(cache, key, 300000, () =>
      loadPortfolioCalendar(
        symbols,
        (batch) => wait(read(batch, controller.signal), controller.signal),
        controller.signal,
      ),
    ).finally(() => {
      current.settled = true;
      if (requests!.get(key) === current) requests!.delete(key);
    });
    requests.set(key, current);
  }
  const current = entry;
  current.users++;
  try {
    return signal ? await wait(current.promise, signal) : await current.promise;
  } finally {
    current.users--;
    if (!current.users && !current.settled) {
      current.controller.abort();
      if (requests.get(key) === current) {
        requests.delete(key);
        invalidateResource(cache, key);
      }
    }
  }
}
