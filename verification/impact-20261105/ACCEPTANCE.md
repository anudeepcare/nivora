# AURYN 1.0.0 impact build — 2026-11-05

## Implemented
- Pace-first research: desktop left/right aligned cards, mobile Pace first, compact diamond, action, conditional boundary, business/conflict explanations and completed/forming context.
- Targets & estimates: analyst targets, annual estimates, AURYN scenarios, historical price risk; explicit account-saved estimate baseline comparisons.
- Home/Discover opportunity map with available sector, Pace and business-evidence filters; no additional universe-wide network fanout.
- Comparison charts use common observed dates and an accessible date readout.
- Optional position-size preview respects existing concentration preferences and quote freshness.
- Historical Pace duration and subsequent outcomes display eligible sample counts. Alerts describe actual supported monthly/price behavior.
- Public conversion page with interactive Discover/Understand/Plan example, clear calls to action and corrected footer.
- Earlier fixes retained: removed automatic saved-view banner and data-coverage panel, Home active navigation, metric help, action spacing and 1.0.0 version.

## Reused existing features
Valuation assumptions and reverse valuation, earnings financial comparisons, business history, portfolio risk and research checkpoints remain available.

## Pending / intentionally not fabricated
- Transcript-linked management promises and new source-grounded AI analysis require transcript/source integration.
- Full company-specific operating KPI coverage requires additional normalized datasets.
- Estimate revisions compare an explicitly saved account baseline; they are not a provider-backed revision archive.
- Opportunity maps cover available loaded research, not every market company. Missing sector data is identified.
- Historical outcomes are observations, not calibrated forecast probabilities. Price/business overlays require verified adjustment provenance.
- Alerts do not add unsupported intra-month boundary-touch/transition notifications.

## Verification
957 application tests passed; API regression suite passed; production build passed. 50 local browser checks passed across 1440/390 widths and light/dark themes, including route loading, overflow, Pace/chart alignment and Targets tab interactions. Screenshots use explicitly labeled illustrative preview data. No production deployment or physical installed-iPhone acceptance performed. These checks do not certify financial forecast accuracy.

Final review also added fail-closed saved-estimate validation and required known matching accounting and share bases before EPS revision percentages are shown.
