# AURYN Sapphire refresh

Implemented in the existing Next.js application, preserving the existing research and portfolio data paths.

- Clean cool-white background, ink text, sapphire default accent and self-hosted Geist variable font (OFL included).
- New shared SVG brand mark and regenerated 192/512/180px application icons; favicon and service-worker cache version updated.
- Primary navigation has a persistent filled selected state and underline, independent of optional accent choices.
- Appearance v2 starts the new palette while retaining the previous spacing preference; optional accents remain available.
- Direct Sign out in the account/workspace dialog, with pending/error handling and disabled preview behavior.
- Reduced Settings spacing, smaller accordion headings and readable Email support shortcut.
- Home and research no longer stretch the adjacent card to the tallest expanded panel.
- Simplified Pace info control, removed decorative crystal, coherent blue reading scale and explicit selected period.
- Consistent neutral evidence cards, removed news row color strips and internal evidence-version copy.
- Added explanatory controls to all twelve financial statement snapshot metrics and portfolio summary metrics.

Validation: 882 automated tests pass, including a new direct account-menu sign-out test. Production build and TypeScript validation pass. git diff --check passes.

Desktop browser review: Settings, company research overview, account menu and Home navigation. Research screenshot uses clearly labelled illustrative preview data. No real account sign-out, billing or trading action was performed. Phone layout, real-account integrations, deployment and every individual route have not been reverified in this pass.

Not deployed or pushed. Source archive includes the existing working-tree changes from preceding work as well as this refresh.
