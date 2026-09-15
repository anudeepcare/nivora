# AURYN V9.9.9.31.1 — Strict Type Build Hotfix
Root cause: rebuildRecentRegime receives r:any, therefore Array.isArray(r.weeklyBars) left weekly inferred as any[]. The three filter callback parameters consequently became implicit any under Next/TypeScript noImplicitAny.
Fix: explicitly type highs/lows/closes as number[] and each nullable filter input as number|null with a type predicate.
No product logic changed.
