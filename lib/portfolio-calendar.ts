import type { HomeFeed } from "./home-feed";
export async function loadPortfolioCalendar(
  symbols: string[],
  read: (batch: string[]) => Promise<HomeFeed>,
) {
  const result = {
    events: [] as HomeFeed["events"],
    issues: [] as string[],
    followed: 0,
    requested: symbols.length,
    eventsReady: true,
  };
  for (let offset = 0; offset < symbols.length; offset += 30) {
    const batch = symbols.slice(offset, offset + 30);
    try {
      const data = await read(batch);
      result.events.push(...data.events);
      result.followed += data.followed;
      result.issues.push(...data.issues);
      if (
        data.eventsReady === false ||
        data.issues.length ||
        data.followed !== batch.length
      ) {
        result.eventsReady = false;
        break;
      }
    } catch {
      result.eventsReady = false;
      break;
    }
  }
  if (!result.eventsReady)
    result.issues.push(
      `Calendar events incomplete: checked ${result.followed} of ${symbols.length} selected stocks. Refresh later to retry.`,
    );
  result.events = [
    ...new Map(
      result.events.map((e) => [`${e.symbol}:${e.date}:${e.kind}`, e]),
    ).values(),
  ];
  return result;
}
