/** Streamed byte cap applies even without a trustworthy Content-Length header. */
export async function readBoundedMarketJson(
  response: Response,
  maxBytes: number,
): Promise<any> {
  if (response.redirected)
    throw Error("Market data redirects are not accepted.");
  if (
    !response.body ||
    Number(response.headers.get("content-length")) > maxBytes
  ) {
    await response.body?.cancel().catch(() => {});
    throw Error("Market data response exceeds the supported size.");
  }
  const reader = response.body.getReader(),
    decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0,
    text = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes)
        throw Error("Market data response exceeds the supported size.");
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    try {
      return JSON.parse(text);
    } catch {
      throw Error("Market data response is not valid JSON.");
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof TypeError)
      throw Error("Market data response is not valid JSON.");
    throw error;
  } finally {
    reader.releaseLock();
  }
}
