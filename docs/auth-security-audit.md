# Authentication security review after replacement

The legacy auth implementation and the preceding JWT-only patch have been
replaced, not retained as fallback paths. See [the architecture and rollout guide](authentication.md).

Implemented controls:

- Environment-validated, independent access JWT and CSRF secrets; HS256 issuer,
  audience, expiry and session validation. No public/hardcoded signing fallback.
- HttpOnly/Secure/host-only first-party refresh cookies and memory-only browser
  access tokens; legacy localStorage credentials are removed.
- Full opaque-token SHA-256 digests, transactional rotation, committed replay
  revocation, absolute session expiry, user-scoped session listing/revocation,
  current-session logout and logout-all. No raw refresh JWT/bcrypt comparison remains.
- Maintained signed double-submit CSRF middleware, browser-binding cookies and
  exact Origin checks on all unsafe cookie-auth routes; exact-origin CORS.
- Passport Google authorization-code exchange, verified email checks, stable
  subject mapping, explicit password proof for linking existing accounts,
  browser-bound one-time state and one-time frontend code handoff.
  Popup source/origin/type checks, nonce CSP and no-store/no-referrer callback HTML.
- Password limits for new accounts, compatibility with existing bcrypt hashes,
  generic signin errors and per-handler auth throttling. All old user/financial
  rows are preserved by an additive migration.

Remaining pre-rollout work/limits:

- Configure secrets and HTTPS/trusted proxy settings in a separately approved
  environment; deploy the backend and Angular contract together only after approval.
- Audit/backfill trusted Google subjects for legacy Google-only
  identities. Do not infer ownership solely from a third-party verified email.
- Real Google provider approval/cancellation, production cookie/proxy behavior,
  browser policies and PWA behavior need browser validation with real configuration.
- Nest throttling is process-local; multiple instances need an aggregate edge/shared
  rate-limit policy. Define retention for inactive sessions without removing replay
  records from live sessions. No Redis or infrastructure was introduced.
- Browser memory is still accessible to a successful same-origin XSS; HttpOnly
  refresh cookies reduce credential exposure but do not replace XSS prevention.
- The Google Safe Browsing warning has no established cause. Neither the prior
  finding nor this replacement proves the cause or automatically removes it.

Only local code, schema, tests and documentation are changed. No commit, push,
merge, deployment, production environment-variable update or Render/Vercel service
modification was performed.
