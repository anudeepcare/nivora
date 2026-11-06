# Holdings toolbar and session recovery

- Holdings: desktop single flex row; mobile title/interval/refresh row and full-width search second row. Accessible labels retained; search icon inside field; controls at least 44px high.
- Mobile header theme button exposed beside avatar.
- HIMS/NOW white wordmark backgrounds restored in light and dark themes.
- Scrolling mobile cards use tinted translucent surfaces without per-card live backdrop filters. Navigation retains blur.
- iOS standalone status-bar metadata changed to black-translucent; existing header safe-area padding retained. Physical-device behavior requires verification, including existing installed PWAs.
- Access loading copy now says workspace. Concurrent access polling is coalesced; transient background failure preserves mounted UI. Explicit 401/403 removes access. Server authorization remains enforced.
- Client retries rejected authentication once after coalesced token refresh. No retry of other failed mutations.
- Home chart caption explicitly identifies daily closing prices and the actual historical date range, separate from current quote date.

Validation: existing 1055 tests passed; 3 additional token-recovery tests passed. Production build recorded separately. No claim of physical iPhone QA or live database permission repair. The generic workspace database error path remains unresolved pending live diagnostics.

Browser preview: Holdings filtering to MSFT removed other stock rows; clearing restored rows. Theme toggle responded. Desktop toolbar alignment inspected; a competing global input border was found and corrected, verified via computed style. Mobile and physical PWA interactions remain unverified.
