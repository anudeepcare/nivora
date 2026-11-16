/** Two quiet recovery attempts per mounted scan scope; never an unbounded poll. */
export function paceRetryDelay(
  attempt: number,
  incomplete: boolean,
): number | null {
  if (!incomplete || !Number.isInteger(attempt) || attempt < 0 || attempt >= 2)
    return null;
  return attempt === 0 ? 31000 : 61000;
}
