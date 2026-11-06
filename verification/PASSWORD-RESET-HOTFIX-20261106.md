# Password reset hotfix — November 6, 2026

Reproduced source defect: the middleware's route allow-list excluded /auth/callback and /auth/confirm, so implemented Supabase exchange/verification handlers could be intercepted by the 404 gate. Both exact routes now pass; arbitrary /auth paths remain rejected.

The recovery page now opens independently of the workspace session boundary, waits for session initialization before showing the password form, preserves explicit callback failure rather than silently sending the user to login, and offers a new-link action when verification fails. An invalid-link flag never enables password editing using an unrelated existing session. Password update remains the authenticated Supabase updateUser operation; no authorization bypass or database-policy change.

Ten focused authentication/routing tests pass. Production build passed. Local HTTP checks verified both recovery handlers return 303 to the reset screen and unknown auth routes remain 404. A real browser check verified an invalid reset link stays on recovery with a new-link action and no password-edit form. End-to-end email delivery and an actual user's password change have not been exercised.

Deployment: copy this cumulative source into preprod, commit/push and promote via PR to main. Request a fresh reset email after deployment. Old one-use links may already be consumed or expired.

Configuration: Supabase Auth URL Configuration must include the exact canonical production host /auth/callback and /auth/callback?next=/reset-password addresses. Existing PKCE email links require the browser that requested them. For cross-browser recovery, the existing /auth/confirm handler supports a Reset Password template link of {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery. SiteURL must match the actual canonical application host. These live dashboard settings were not changed by this source hotfix; verify them before claiming cross-browser acceptance. Email link scanners may consume one-use links.

AURYN Accumulation Pace naming feedback is deferred to keep this security-sensitive fix focused.
