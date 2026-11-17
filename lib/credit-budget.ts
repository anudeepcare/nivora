export function createCreditBudget(total = 55, backgroundLimit = 42) {
  let minute = -1,
    used = 0,
    backgroundUsed = 0;
  return (cost: number, background: boolean, now = Date.now()) => {
    if (!Number.isInteger(cost) || cost < 1 || cost > total) return false;
    const next = Math.floor(now / 60000);
    if (next !== minute) {
      minute = next;
      used = 0;
      backgroundUsed = 0;
    }
    if (
      used + cost > total ||
      (background && backgroundUsed + cost > backgroundLimit)
    )
      return false;
    used += cost;
    if (background) backgroundUsed += cost;
    return true;
  };
}
