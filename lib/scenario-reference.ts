import type { Research } from "./types";
import { selectPriceReference } from "./price-reference.ts";
/** One admissible price/date/currency basis for the same model on every screen.
 * This does not turn analyst targets or historical ranges into model forecasts. */
export function scenarioResearchInput(research: Research): Research {
  const reference = selectPriceReference(
    research,
    Date.parse(research.priceObservedAt ?? research.retrievedAt),
  );
  if (!reference) return research;
  return {
    ...research,
    quote: {
      ...research.quote,
      price: reference.price,
      asOf: reference.asOf,
      currency: reference.currency,
      stale: false,
    },
  };
}
