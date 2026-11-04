# Home, spacing and domain follow-up — 23 October 2026

## Home becomes an account-aware briefing

The chart previously selected the first saved symbol. It now defaults to the largest absolute estimated dollar price impact on the latest comparable US-equity observation date. If there is no nonzero comparable move, a held upcoming event is next, then the largest priced holding. Once selected, the choice stays stable; a manual selection stays selected and is labelled. A missing quote does not silently select the first company.

A three-part session strip shows estimated price-reference movement, breadth/coverage and upcoming-week company events. It is **not brokerage P&L**: current recorded units are applied to the quote's stated price change, excluding trades, cash flows, fees, crypto and mismatched observation dates. Duplicate lots combine. Missing changes do not become zero; incomplete coverage is labelled partial. Current assets/net equity are not repeated on Home. Up/down contribution bars use the three largest absolute drivers, with real values and colours.

News now shows total matching headlines and distinct companies in the selected group. The initial three highlights have an explicit **View all N updates** control; expanded news uses the already cached response rather than extra requests. Desktop expansion scrolls within the news area; mobile expansion uses the main page scroll. Holdings get priority over watchlist names; at most thirty stock symbols are requested per selectable feed group. A missing article is not evidence that no event happened. Failed coverage is disclosed. There is no claim to have checked every holding when more groups remain.

The new session strip and contribution bars use green/red for direction, blue for account context, amber for upcoming events. No fictional market index or account performance chart is inserted.

## Requested interface cleanup

- “Find a setup in your companies” is removed from Research Home; its lazy discovery import no longer loads there. The underlying experimental feature is retained for later.
- Removed a generic section margin that compounded the grid gap. Additional Overview metrics use compact margins and a rounded aligned frame.
- Company context has a concise heading and two desktop disclosure columns, stacked on phones. Data is retained.
- Footer bottom padding is increased so legal/help content has breathing room. PWA status-surface/header/dock geometry is unchanged.

## Email/password on the custom domain

Read-only checks confirmed `getauryn.vercel.app` and `auryninvest.com` resolve to the same deployment. The custom domain redirects to `www.auryninvest.com`. The public login HTML matched, and both bundles reference the same Supabase project. No password or credential was supplied or inspected. The reported “invalid credentials” failure has **not** been reproduced or certified fixed.

Because saved credentials are origin-specific, test by clearing autofill and manually entering the exact credentials that work on getauryn. Form fields now have explicit email/username and password names/autocomplete hints; only the email is trimmed, never the password. If the manually entered password still fails, use password recovery and report the exact error. OAuth redirect configuration cannot explain a password rejection before sign-in succeeds.

For confirmation/recovery/OAuth links, align Supabase with the canonical domain shown by Vercel. If Vercel continues to redirect to www, set Site URL to `https://www.auryninvest.com` and allow:

- `https://www.auryninvest.com/auth/callback`
- `https://www.auryninvest.com/auth/callback?next=/reset-password`
- `https://www.auryninvest.com/auth/confirm`

Retain the existing getauryn and apex callbacks for older links as appropriate. This is configuration guidance, not a claim that the live dashboard has been changed. No user account, password, auth provider or production setting was changed here.
