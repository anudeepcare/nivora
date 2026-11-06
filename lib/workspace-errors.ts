type QueryResult = { status: number; error: { code?: string } | null };
/** Preserve authentication failures so the client can renew its session once. */
export function workspaceFailure(results: QueryResult[]) {
  const failed = results.filter((result) => result.error);
  if (failed.some((result) => result.status === 401))
    return { status: 401, message: "Your session needs to be refreshed. Please try again." };
  if (failed.some((result) => result.status === 403 || result.error?.code === "42501"))
    return { status: 403, message: "Your saved investments are not accessible. Please contact support if this continues." };
  return { status: 503, message: "Saved investments are temporarily unavailable. Please try again." };
}
