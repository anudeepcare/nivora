# Secure local provider setup

The account portals are the source of truth for subscriptions. Auryn never needs portal passwords and does not expose provider credentials to browser code.

## One-time local setup

1. Copy `.env.example` to `.env.local` on the machine that runs the server.
2. Set file permissions to owner-only: `chmod 600 .env.local`.
3. An authorized account owner pastes the existing values directly into that local file:
   - `EODHD_API_TOKEN`
   - `SENTISENSE_API_KEY`
   - a separate random `AURYN_APP_API_KEY` of at least 24 characters for unlocking the local browser session
4. Set `SENTISENSE_PLAN=Pro`. Leave rate-budget variables blank until their exact enforceable limits are verified. EODHD currently shows 100,000 API-call units per day, but the app must not translate this daily allowance into an invented rolling-window value.
5. Run `npm run start:local`. The server binds to `127.0.0.1`; provider credentials remain in the Node process and provider requests are made only by fixed server-owned routes.

`.env.local` is gitignored. Never paste credentials into chat, source files, browser JavaScript, URLs, test fixtures, issue trackers, or command arguments. Do not commit or upload the file. The checked-in `.env.example` contains names only.

## Acceptance before enabling broad validation

- Call `/api/health` and confirm only boolean configured states are returned.
- Unlock the local app using `AURYN_APP_API_KEY`; the browser exchanges it for an opaque HttpOnly, SameSite session cookie.
- Run at most five exchange-qualified securities through the documented live-acceptance plan. Retain only status, timestamps and provenance, not bulk provider payloads.
- Confirm exact requested/returned identity, currency, timestamps, preview/sample flags, rate-limit headers and endpoint-specific schemas.
- Record verified entitlements endpoint by endpoint. A configured secret or active subscription is not proof that every documented endpoint is included.

No production deployment is authorized. File-based quotas coordinate only processes sharing one filesystem and are not distributed enforcement.
