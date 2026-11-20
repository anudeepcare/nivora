# Auryn r38 · Screenshot backlog fixes

Cumulative on r37. The historical review covered 210 image files across older and newer batches (207 byte-distinct files, including design references and third-party comparisons). A related source change is not, on its own, a live or pixel-level verification.

- **Atlas:** Show the existing model's distinct stances for a holding and a new purchase. Keep those labels separate from the independent Pace reading and preserve all scenario values.
- **Technicals:** Retain numerical reference prices while explicitly marking them not plotted when reference lines are turned off.
- **Pace history:** Use a single correctly pluralized duration when both endpoints are identical.
- **Indicators:** Group wholly unavailable metrics by source while preserving available values, dated histories, definitions and the distinction between missing and zero.
- **Today Pace:** Preserve coverage status and refresh for a nonempty universe even if no readings qualify; distinguish no qualifying readings from incomplete evidence.

No provider, prices, models, credentials, access, schema or deployment changes. Account-specific performance history still depends on validated dated transactions. Market Radar setup and support email delivery remain separate operational checks.
