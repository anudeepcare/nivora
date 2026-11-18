/** Adapter fixtures isolate the already independently tested distributed guard.
 * Production adapters always call sentisenseFetch; only fixture compilation
 * supplies this explicit passthrough so no database/network is used in tests.
 */
export function providerFixtureFunction(...args) {
  const body = args.pop();
  return new Function(
    ...args,
    "const sentisenseFetch = (input, init, fetcher = fetch) => fetcher(input, init);\n" +
      body,
  );
}
