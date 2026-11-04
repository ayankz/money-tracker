# Authentication

The replacement module uses NestJS Passport/JWT, Prisma/PostgreSQL, bcrypt,
`cookie-parser`, `csrf-csrf` and Nest's throttler. No external authentication service,
Redis, or framework-specific session abstraction is required.

## Browser and API flow

- Email/password signup and signin return only `{ access_token, expires_in }`.
  HS256 access JWTs expire after 15 minutes, carry an issuer, audience, session ID
  and unique ID, and are kept only in Angular memory. They are never persisted in
  localStorage or sessionStorage. Angular removes both legacy storage keys.
- A refresh credential is a random 256-bit opaque token in a host-only, HttpOnly,
  SameSite=Lax cookie. It has a seven-day absolute session lifetime. Production
  cookies are Secure and use the `__Host-` prefix with `Path=/` and no Domain.
  Refresh tokens are never returned in JSON or sent in Authorization headers.
- Browser auth requests use **relative `/api/auth/...` URLs** through the existing
  Angular/Vercel API proxy. This makes the refresh cookies first-party and avoids
  relying on third-party cookies between Vercel and Render. Keep the `/api` rewrite
  pointing at `https://wallet-app-nest.onrender.com/api/:path*` and preserve Cookie,
  Set-Cookie, Origin and X-CSRF-Token headers. Do not cache these responses.
- Existing financial HTTP requests keep their configured API origin and send only
  the access bearer token. The API checks the database session on every protected
  request, so logout/revocation invalidates already-issued JWTs immediately.
- On reload, Angular restores the session before routing via cookie refresh.
  Concurrent 401s share one refresh. Web Locks additionally serialize same-origin
  browser-tab auth operations where supported. Without Web Locks, simultaneous
  cross-tab refreshes can fail closed and require sign-in again.

## Rotation and session management

`auth_sessions` stores the owner, creation/last-used/expiry times, optional truncated
user agent and revocation time. `refresh_tokens` stores only a SHA-256 digest of
**the full random token**, session membership and consumption time; no bcrypt token
truncation or raw refresh credentials remain.

Refresh locks the session row, atomically claims an unused token, and creates its
successor in a transaction. Reusing a recognized consumed token revokes its entire
session, including the newest access/refresh credentials. Revocation commits before
an Unauthorized response is thrown. Unknown random tokens cannot revoke sessions.
Concurrent rotations of the same token have one winner; the detected replay then
revokes that session. Session expiry is absolute, not extended by rotation.

The Profile page shows the real account email and active browser sessions. A user
can revoke one owned session, sign out this browser, or revoke all their sessions.
An arbitrary session ID cannot be used to revoke another user's session.

## CSRF and OAuth

`GET /api/auth/csrf` issues a signed double-submit token through `csrf-csrf`, bound
to a separate random HttpOnly browser-binding cookie. Angular receives the CSRF
value in JSON and sends it in `X-CSRF-Token`. All unsafe auth endpoints also require
an exact `Origin` match to `FRONTEND_ORIGIN`. This includes signin/signup (login
CSRF), refresh, code exchange, logout and session revocation. Cookies alone, body
fields, query tokens and a foreign origin are insufficient. Bearer-only financial
endpoints do not use cookies for authentication.

Google remains a server-side authorization-code flow using `passport-google-oauth20`:

1. Angular opens the existing API `/api/auth/google` popup directly at
   `environment.backendOrigin`, preserving the current production API/callback host.
2. Passport's custom PostgreSQL state store creates random state and an independent
   HttpOnly browser-binding cookie on the API host. Only state/binding hashes are
   stored, with a ten-minute expiry. Callback consumption is atomic and one-time.
   Missing, foreign-browser, forged, expired and reused state fail before code
   exchange with Google. No process-local OAuth session store is used.
3. Google must return a verified email. The stable Google subject is the identity.
   Existing accounts are never linked by email alone: a pending exchange requires
   the existing password before linking a new Google subject. Angular prompts for
   that proof on the signin form. This also prevents pre-hijacked, unverified local
   accounts retaining an attacker's password after email-only auto-linking.
   Existing subject bindings cannot be silently replaced. New verified Google
   users can register normally.
4. The callback returns a nonce-CSP HTML page with only a **60-second one-time
   application exchange code**, not JWTs or a refresh cookie. It posts solely to
   the configured frontend origin and closes the popup. Responses use no-store
   and no-referrer headers; user/config strings are safely serialized.
5. Angular accepts only the expected message type from the exact API origin and
   the exact Window it opened. It exchanges the code through its first-party API
   proxy with CSRF protection. The atomic exchange sets the refresh cookie on the
   frontend host and returns an in-memory access token. Reusing the code fails.

Google cancellation and provider/start/callback failures return a generic,
non-cacheable popup error signal to the exact frontend origin. Provider details
are not reflected. Angular checks the signal's source/origin/type, closes the
popup and restores the signin form. Manually closed windows and timeouts also
restore the form; a short close grace period lets a queued success message arrive.
Leaving the signin page clears the popup listener/timers and closes its window.

Google provider tokens and real OAuth client secrets never enter the browser.

## Required API environment

| Variable | Meaning |
| --- | --- |
| `DATABASE_URL` | Existing PostgreSQL connection; unchanged by the rewrite |
| `JWT_ACCESS_SECRET` | Independent cryptographically random secret, at least 64 characters |
| `CSRF_SECRET` | Different random secret, at least 64 characters, used by the CSRF library |
| `FRONTEND_ORIGIN` | One exact trusted origin, e.g. `http://localhost:4200`; no wildcard, path, credentials or trailing slash |
| `GOOGLE_CLIENT_ID` | Existing Google OAuth web client ID |
| `GOOGLE_CLIENT_SECRET` | Existing Google OAuth web client secret; API only |
| `GOOGLE_CALLBACK_URL` | Full public API URL ending `/api/auth/google/callback`, unchanged Google registration |

| Optional variable | Default / rule |
| --- | --- |
| `NODE_ENV` | Existing Nest dotenv selection; production requires HTTPS origins and Secure cookies |
| `AUTH_COOKIE_SECURE` | `true` in production, `false` locally; cannot be false in production |
| `JWT_ISSUER` | `money-tracker-api` |
| `JWT_AUDIENCE` | `money-tracker-web` |
| `TRUST_PROXY` | `0`; explicit trusted proxy hop count 0–3. Configure correctly for the actual hosting topology so rate limits see the intended client IP; never blindly trust arbitrary forwarded headers |
| `PORT` | Existing default 3333 |

`JWT_REFRESH_SECRET` is obsolete: refresh tokens are opaque, not JWTs. Do not retain
a fallback to the old public signing keys. Validate/generate secrets locally, e.g.
`node -e "console.log(require('node:crypto').randomBytes(48).toString('base64'))"`
separately for each secret. Never paste values into source, browser config, logs,
PR descriptions or deployment images. No environment files are committed.

Startup rejects missing/obviously weak configuration. Complexity checks cannot
prove randomness; use a CSPRNG/secret manager. Changing the access secret invalidates
access JWTs, but existing opaque refresh sessions can mint new ones. To revoke all
sessions for an incident, also revoke the corresponding database session records.

## Data-preserving migration and rollout

`20261104010000_auth_sessions` is transactional and additive: it adds one nullable
unique `users.googleSubject` column and four auth tables. It does not delete or
rewrite user rows, password hashes, financial tables, IDs or foreign-key ownership.
The legacy nullable `hashRt` column/data is retained for compatibility but is never
read or written by the new implementation. Existing bcrypt password hashes remain
valid; new passwords must be at least 12 characters and at most 72 UTF-8 bytes.
Existing signin passwords retain the legacy bcrypt verification behavior.

Before any separately approved rollout:

1. Back up the intended database; inspect and apply the migration with
   `npm run prisma:migrate:deploy`. Do not use `migrate reset` or `db push`.
2. Audit existing account email/Google mappings. Legacy Google-only accounts
   cannot be safely identified from an email alone and have no usable password: backfill
   their Google subject from trusted provider/account records, or provide an
   authenticated recovery process before rollout. Users who have an existing
   local password can link Google themselves by proving that password during the
   one-time code exchange; wrong or missing proof does not consume the grant. No users/data are merged
   or deleted. Ambiguous historical email-case matches are rejected rather than
   merged; exact existing addresses retain priority.
3. Provision the required API variables and matching Google callback registration.
   Keep the existing API/domain, frontend origin and first-party API proxy. Preview
   origins require explicitly matching isolated configuration; no wildcard CORS.
4. Release backend and Angular together. The legacy refresh-token JSON/bearer
   contract and browser storage are removed. Existing legacy sessions must sign
   in again; preserving users/data does not preserve insecure legacy sessions.
5. Exercise real Google approval/cancel/error popup flows, cookie behavior and page
   reload in supported browsers. This work does not deploy or modify infrastructure.

Authentication rate limits use Nest's in-process throttler (10/minute per signin,
signup and Google-start handler; other auth handlers 60/minute per handler/IP).
For multiple API instances, enforce an aggregate edge/shared limit as a separately
reviewed hosting change. Define an operational retention job for expired/revoked
sessions and their consumed-token digests; do not prune digests for live sessions.
Expired OAuth state/grant records are also pruned during new flow creation.

## Validation commands

```sh
npm run prisma:generate
npm run test:auth-security --workspace apps/api
npm run test:auth --workspace apps/web
# Explicit local disposable database, already migrated:
AUTH_TEST_DATABASE_URL=postgresql://.../money_tracker_auth_test npm run test:auth:seed --workspace apps/api
AUTH_TEST_DATABASE_URL=postgresql://.../money_tracker_auth_test npm run test:auth-integration --workspace apps/api
npm run build
npm run type-check
npm run lint
npm run test:ci
```

The PostgreSQL integration suite refuses a non-local/non-`_auth_test` database.
It expects an explicit synthetic legacy fixture with ID 424242, email
`legacy@gmail.com`, password `legacy-only-test-password` (bcrypt), two accounts
(first balance 123.45), and one transaction, transfer and upcoming payment. Use only
a disposable database. Tests also create uniquely named synthetic users/sessions;
they never reset/delete an existing database. The `test:auth:seed` helper creates the fixture records idempotently and refuses a
non-local/non-test database; it does not overwrite existing fixture rows.

Focused Angular tests have their own target so the documented unrelated legacy
`Operations` test import does not prevent running authentication coverage. The
root test runner still runs the legacy suites and reports their failures; no old
test was disabled. HTTP Google provider responses are mocked in integration tests.
Real Google approval, provider outages, production HTTPS cookie/proxy settings and
full browser PWA behavior still require pre-rollout browser validation.

The reported Google Safe Browsing warning has no established cause here. Rewriting
authentication does not itself remove a domain warning; inspect the actual flagged
URLs and provider diagnostic/review process independently.
