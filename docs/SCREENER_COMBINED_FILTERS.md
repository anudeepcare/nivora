# Combined factual stock and ETF filters

The existing screeners accept a primary numeric condition and one optional additional condition. Both must match (AND). Sorting uses the first measurement. This is one explicit submission and one fixed provider request, not two result sets merged locally. Up to 100 returned rows are paged locally; total matches and truncation remain visible.

Useful combinations include target upside plus minimum analyst count, or annual ETF fee plus minimum constituent-data coverage. Existing units remain unchanged: ETF expense ratio 0.09 means 0.09%, coverage and upside use percentage points, market cap/AUM use USD, and counts are whole numbers. Missing source fields never match. No values are supplied automatically.

Only existing field allowlists and GTE/LTE are accepted. A second condition cannot contain nested conditions or unknown fields. Duplicate same-field/same-direction conditions and contradictory same-field ranges are rejected. Every stock condition independently receives analyst/technical feature checks before provider acquisition; existing authenticated access, user/global request limits, research reservation, closed result projection and private responses remain in place.

Official contract: https://sentisense.ai/docs/api/screener/ (plan filters are ANDed). This is deliberately not the full provider query language or executable catalog presets. No live provider or browser-rendered verification was performed for this change.
