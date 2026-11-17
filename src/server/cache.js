export class RateAwareCache {
  constructor({ now = Date.now } = {}) { this.now = now; this.values = new Map(); this.pending = new Map(); }
  async getOrLoad(key, ttlSeconds, loader) {
    const hit = this.values.get(key);
    if (hit && hit.expiresAt > this.now()) return { ...hit.value, cache: 'hit' };
    if (this.pending.has(key)) return this.pending.get(key);
    const promise = Promise.resolve(loader()).then(value => {
      const result = { ...value, cache: 'miss' };
      if(!value?.status||['live','preview','available'].includes(value.status))this.values.set(key, { value: result, expiresAt: this.now() + ttlSeconds * 1000 });
      return result;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, promise); return promise;
  }
  static key(...parts){const normalize=v=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,x])=>[k,normalize(x)])):v;return parts.map(x=>typeof x==='object'?JSON.stringify(normalize(x)):String(x)).join(':')}
}
