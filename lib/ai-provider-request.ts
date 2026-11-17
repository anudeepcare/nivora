/** Optional server-configured fallback; never switch providers or transmit additional user data. */
export async function aiProviderRequest(
  fetcher: typeof fetch,
  key: string,
  model: string,
  body: Record<string, unknown>,
  fallback?: string,
) {
  const models = [model, ...(fallback && fallback !== model ? [fallback] : [])];
  let response: Response | undefined;
  for (let i = 0; i < models.length; i++) {
    response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(i === 0 ? 35000 : 15000),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ ...body, model: models[i] }),
    });
    if (
      response.ok ||
      ![429, 502, 503, 504].includes(response.status) ||
      i === models.length - 1
    )
      return { response, model: models[i] };
  }
  return { response: response!, model };
}
