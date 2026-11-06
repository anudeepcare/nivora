# Mobile screenshot corrections — November 6, 2026

- Public navigation expands in document flow instead of covering the hero headline. Mobile header height and menu-button styling are reduced.
- Portfolio coverage text uses normal paragraph flow, overriding the shared flex style that caused words and values to collide. Historical and latest quoted values use labelled rows, stacked on narrow mobile screens.
- The live PaceInstrument card, its accessibility label, help dialog and public introduction now say AURYN Accumulation Pace. It describes gradual position building; it does not promise a fixed contribution multiplier.
- Saved research changes have a shorter disclosure label and a visible native disclosure marker.

Validation: production build including TypeScript passed; 83 targeted UI, public-page and recovery tests passed. Earlier broader regression results apply to the preceding cumulative release. No additional data calculations, subscription rules or password-reset logic were changed in this polish.

Password reset: the previous release's verified-account recovery implementation is retained. Live email reset is not certified until the Supabase recovery email template points to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery and a fresh email is exercised. See RECOVERY-AND-MOBILE-20261106.md. No actual user password was changed here.

No branch was created and no code was deployed. This archive replaces the previous cumulative source archive for the existing preprod/main workflow. Native installed-iPhone rendering still requires device acceptance.
