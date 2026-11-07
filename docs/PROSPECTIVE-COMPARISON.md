# Prospective Pace comparison

The public feed is a dated observation log. To evaluate actual subsequent returns, the read-only owner research command is:

```
node --experimental-strip-types scripts/run-pace-prospective.mjs audited-study.json security-symbol-map.json prospective-result.json
```

Use the study contract in PACE-STUDY-INPUT.md, including raw-price replay. The mapping is a JSON object from audited stable security IDs to their publication symbol. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the publication database. No service secret is required, no writes occur, and output overwrite is refused.

The command recomputes current policy, requires complete valid replay rows, reads the full paginated same-stock publication history and matches each prior-month period, policy fingerprint and contribution multiple. A record must precede execution, follow the completed signal, and carry dated evidence. Outcomes must be in the past. P0/P1 spend zero, P2 spends 1x, P3 2x, P4 up to 4x; available cash is the cap. The underlying paired-account calculation includes equal monthly budgets, idle cash returns, costs and supplied total-return values.

Results include the existing paired terminal wealth/drawdown accounting, per-name results and publication receipts. Publication quotes are not substituted for execution prices. No aggregate win rate is exposed publicly by this command. Missing receipts, mismatched stocks or late publication stop the report; old auryn-v9.8 observations cannot qualify.

The security mapping, corporate-action conventions, return data and completeness require independent audit. Source/mapping hashes are integrity receipts, not proof of authenticity. A database timestamp is not independent timestamp certification. This command never promotes a result to publishable or writes to the public feed.

On recovery inspection on 7 November 2026, the current-policy publication table contained zero rows. There is no real prospective return series to report yet.
