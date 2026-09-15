# AURYN V9.9.9.24.1 — Compile Hotfix
Moves `formatPriceObservedAt` above the progressive `if (!d || !view)` early return. V24 referenced the block-scoped formatter from that early render before its declaration, which TypeScript correctly rejected. No price-state behavior, provider selection, Market Truth, refresh policy, or UX semantics are changed.
