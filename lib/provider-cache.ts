/** Bounded LRU with identity-safe eviction of rejected refreshes. */
export function createProviderCache(capacity = 250) {
  const entries = new Map<
    string,
    { expires: number; retainUntil: number; value: Promise<any> }
  >();
  async function cached<T>(
    key: string,
    ttl: number,
    read: () => Promise<T>,
    retained?: { milliseconds: number; restore: (value: T) => T },
  ): Promise<T> {
    const old = entries.get(key);
    if (old && old.expires > Date.now()) {
      entries.delete(key);
      entries.set(key, old);
      return old.value;
    }
    const entry = {
      expires: Date.now() + ttl,
      retainUntil: Date.now() + ttl + (retained?.milliseconds ?? 0),
      value: Promise.resolve() as Promise<any>,
    };
    entry.value = Promise.resolve()
      .then(read)
      .catch(async (error) => {
        if (retained && old && old.retainUntil > Date.now()) {
          try {
            const previous = await old.value;
            entry.retainUntil = old.retainUntil;
            entry.expires = Math.min(entry.expires, old.retainUntil);
            return retained.restore(previous);
          } catch {
            /* Rejected data is not a last-good value. */
          }
        }
        if (entries.get(key) === entry) entries.delete(key);
        throw error;
      });
    entries.delete(key);
    entries.set(key, entry);
    if (entries.size > capacity) entries.delete(entries.keys().next().value!);
    return entry.value;
  }
  return Object.assign(cached, {
    async invalidate(key: string, expected: unknown) {
      const entry = entries.get(key);
      if (!entry) return;
      try {
        if ((await entry.value) === expected && entries.get(key) === entry)
          entries.delete(key);
      } catch {
        /* Failed entries evict themselves. */
      }
    },
  });
}
