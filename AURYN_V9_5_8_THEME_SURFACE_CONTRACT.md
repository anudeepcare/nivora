# AURYN V9.5.8 — Theme Surface Contract

Root-cause correction for theme readability and Technicals/Portfolio translation.

- Removes translucent theme-on-legacy-surface behavior by making every stock evidence tab own a paired card background + foreground.
- Technicals now has three deterministic layers: reading card, soft score rail, and high-readability indicator surface.
- Noir, Sapphire and Racing Green retain their premium dark page/chrome identity but use calm light reading cards for dense research content.
- Portfolio evidence/readout cards use the same paired surface contract.
- Large text mode is now a meaningful 118% supporting-copy scale across the app instead of changing only a few tiny labels.
- Financial positive/negative semantics and the approved layout remain unchanged.
- Search architecture from V9.5.7 remains unchanged.

Verification: node --test tests/auryn-v958-theme-surface-fontscale.test.mjs tests/auryn-v957-search-personalization.test.mjs tests/auryn-v956-pwa-theme-contract.test.mjs tests/auryn-v950-centered-ios-tabbar.test.mjs tests/auryn-v942-mobile-technicals-portfolio.test.mjs tests/auryn-v936-research-ui.test.mjs
