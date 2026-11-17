/** Public, immutable evidence only. Weak keys release cached work with its dataset. */
export function evidenceMemo<T>() {
  const cache = new WeakMap<object, Map<string, T>>();
  return (input: object, key: string, compute: () => T): T => {
    let entries = cache.get(input);
    if (entries?.has(key)) return entries.get(key)!;
    const value = compute();
    if (!entries) {
      entries = new Map();
      cache.set(input, entries);
    }
    entries.set(key, value);
    if (entries.size > 3) entries.delete(entries.keys().next().value!);
    return value;
  };
}
