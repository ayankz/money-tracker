# Monorepo migration validation

Original source commits:

- `money-tracker/main`: `82862da8038272d57a1cf5ce65c274596c188f20`
- `wallet-app-nest/main`: `ff5bee5940392555ad4c34e284b50106c4159ede`

Baseline checks ran against the original layouts before the import. Application
source files, Prisma schema/migrations, API configuration, and OAuth handlers are
unchanged by the migration. No dependency upgrades were made. The root lockfile
retains every original package version in separate nested workspace trees.

## Checks

| Check | Original layout | Monorepo |
| --- | --- | --- |
| npm 10.9.4 clean install | Both pass | Pass |
| Angular production build | Pass, two SCSS budget warnings | Same |
| Nest production build | Pass | Pass |
| Prisma Client generation | 6.11.0, pass | 6.11.0, pass |
| Angular application typecheck | Pass | Pass |
| Angular tests / test typecheck | Missing `Operations` export | Same |
| API unit tests | 13 suites fail; 1 suite/test passes | Same |
| API end-to-end test | Existing `src/prisma/prisma.service` resolution failure | Same |
| API typecheck | Pass | Pass |
| API ESLint (no fixes) | 18 errors, 1 warning | Same |

Angular's failure is in `apps/web/src/app/services/operations/operations.spec.ts`:
the test imports a nonexistent `Operations` export. Backend failures include Jest's
existing inability to resolve `src/...` imports, missing mocked providers, and tests
of commented-out modules. These failures were deliberately not repaired during
repository restructuring. There is no configured frontend ESLint task.

The Angular build needs network access to inline its existing Google Fonts CSS.
Initial sandbox-only attempts failed; the network-enabled baseline and migrated
production builds pass. Prisma generation also needs access to its engine cache;
it succeeded with the required local permissions. These were environment failures.

## Runtime and deployment verification

- All 17 unchanged migrations applied successfully to an isolated disposable
  PostgreSQL database on port 55433; no existing database was used.
- `npm run dev` starts both applications. Frontend `/` returns 200; direct API
  `/api/health` and frontend-proxied `/api/health` both return `{"status":"ok"}`.
- OAuth authorization returns 302 with the existing local `/api/auth/google/callback`
  redirect URI using dummy credentials. Real Google authentication and popup
  completion require existing OAuth credentials and a browser; they were not run.
- The backend Docker image builds using the repository-root context and includes
  the generated Prisma Client in the API's nested dependency directory. The
  production container starts, connects to the disposable database, and returns
  `{"status":"ok"}` from `/api/health` on host port 3334. It contains Prisma 6.11.0,
  all 17 migrations and no dotenv files. The image preserves the original behavior
  of receiving `NODE_ENV` from the runtime environment rather than setting it.
- A fresh frontend-only `npm ci --workspace apps/web` and `npm run build:prod`
  succeed using the Vercel configuration, without installing the API dependencies.
- The production PWA contains its manifest and service worker; all 60 asset hashes
  listed in `ngsw.json` match their generated files.

Live Vercel/Render settings are not stored in these repositories and were not
changed. The root README lists the required manual settings for the existing
projects/services. Preview deployment and browser PWA installation/offline checks
remain required before an approved production rollout.
