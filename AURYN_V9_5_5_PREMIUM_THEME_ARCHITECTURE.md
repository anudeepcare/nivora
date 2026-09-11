# AURYN V9.5.5 — Premium Theme Architecture

AURYN Classic is the reference edition. Premium editions: Noir Champagne, Midnight Sapphire, British Racing Green, Bordeaux Reserve, Arctic Graphite, Porcelain Bronze.

This release removes the V9.5.4 global override block rather than stacking another patch. Semantic foreground/background tokens protect decision heroes, metric cards, chart labels/grid and navigation. Financial positive/negative/warning semantics remain invariant.

The autocomplete result markup is rebuilt with isolated DIV slots. Mobile rows use a deterministic ticker/company/exchange hierarchy with a pinned Open action and contained scrolling.

Technicals receives dedicated semantic surface/alignment hooks without changing data, indicators, engine decisions or approved navigation geometry.

Verification: npm run gate:v955
