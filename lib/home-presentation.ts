/** Account composition depends on saved user content, never sample holdings. */
export function homeComposition(
  positionCount: number,
  followedCount: number,
): "first-use" | "watchlist" | "holdings" {
  return positionCount > 0
    ? "holdings"
    : followedCount > 0
      ? "watchlist"
      : "first-use";
}
