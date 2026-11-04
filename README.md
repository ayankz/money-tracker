# Money Tracker / SaveToDream

An npm workspace containing the existing Angular PWA and NestJS API. No Nx or Turborepo.

```text
apps/web/    Angular 21, Vitest 4, TypeScript 5.9.3
apps/api/    NestJS 11, Prisma 6.11.0, Jest 29, TypeScript 5.8.3
```

## Install

Use Node 22.12+ (22.x) or Node 24 and npm **10.9.4**, as declared in `package.json`.
The backend Docker image retains its existing Node 20 Alpine runtime.

```sh
npm ci
npm run prisma:generate
```

Run installs from the repository root. There is one root `package-lock.json`.
`.npmrc` uses `install-strategy=nested` so each application keeps its original
dependency tree, including its own TypeScript version. Do not deduplicate, upgrade,
or move app tooling to the root as part of this migration. To add a dependency
later, use `npm install <package> --workspace apps/web` (or `apps/api`).

## Local configuration and development

Provide the API's existing configuration through your local process environment
or an **untracked** `apps/api/.env`. With `NODE_ENV=production`, Nest uses process environment variables or
`apps/api/.env.production`; otherwise it uses `.env`, exactly as before. No
environment files are included in Docker images. The image does not set or change
`NODE_ENV`; retain the existing service configuration.
The workspace scripts run with `apps/api` as their working directory, preserving
Nest's existing environment-file lookup. Never put secrets in Angular environment
TypeScript files: those files are public browser configuration.

Authentication now uses a session table, in-memory access JWTs and first-party
HttpOnly refresh cookies. Required API settings are `DATABASE_URL`,
`JWT_ACCESS_SECRET`, `CSRF_SECRET`, `FRONTEND_ORIGIN`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL`. The two secrets must be independent,
cryptographically random strings of at least 64 characters. `JWT_REFRESH_SECRET`
is no longer used. Production requires HTTPS and Secure cookies.

For local development use frontend origin `http://localhost:4200` and Google
callback `http://localhost:3333/api/auth/google/callback`. Keep the existing `/api`
proxy enabled: browser authentication uses relative URLs so refresh cookies remain
first-party. Financial API calls retain their existing configured API origin.

See [authentication design, environment variables, migration and validation](docs/authentication.md).
The schema migration is additive and preserves existing users/password hashes and
financial rows. Legacy sessions require a new sign-in. Existing legacy
Google-only users need a trusted Google-subject backfill or recovery plan before
rollout; their account/data are not deleted or merged. No deployments or production
configuration changes have been applied.

```sh
# Optional local PostgreSQL, preserving the existing compose service/volume:
docker compose -f apps/api/docker-compose.yml up -d db
# Apply existing migrations only to your intended local database:
npm run prisma:migrate:deploy
npm run dev
```

`npm run dev` starts both apps and stops both when interrupted. Alternatively:

| Command | Purpose |
| --- | --- |
| `npm run dev:web` / `npm start` | Angular on port 4200 |
| `npm run dev:api` | Nest watch mode, default port 3333 (`PORT` can override) |
| `npm run build` | Both production builds; API generates Prisma Client first |
| `npm run build:web` / `npm run build:api` | Individual builds |
| `npm test` / `npm run test:ci` | Both unit suites plus JWT security regressions; reports all failures |
| `npm run test:web` / `npm run test:api` | Individual unit suites |
| `npm run test:auth-security --workspace apps/api` | Focused auth configuration/JWT/Google regression suite |
| `npm run test:auth --workspace apps/web` | Angular cookie, refresh/interceptor and popup regressions |
| `npm run test:auth-integration --workspace apps/api` | Auth HTTP/PostgreSQL integration (explicit disposable test database required) |
| `npm run test:e2e` | Existing backend end-to-end suite |
| `npm run type-check` | Both TypeScript checks, including Angular test sources |
| `npm run lint` | Existing backend ESLint, without modifying files |
| `npm run lint:fix` | Existing backend ESLint with fixes |
| `npm run prisma:validate` | Validate the unchanged Prisma schema |
| `npm run serve:pwa` | Build and serve production PWA on port 4200 |

There is no existing Angular ESLint configuration. Frontend compilation and
TypeScript checks remain separate from the backend ESLint configuration.
The legacy optional Husky tooling is not installed or activated automatically.

The API prefix remains `/api`. Angular's local proxy still forwards `/api` to
`http://localhost:3333`; its existing HTTP service also uses that origin directly.
Verify both with `curl http://localhost:3333/api/health` and
`curl http://localhost:4200/api/health`. Swagger remains at `/docs` on the API.

## PWA

Service worker registration, `ngsw-config.json`, icons and the web manifest remain
in `apps/web`. Production output is `apps/web/dist/save-to-dream/browser`, including
`ngsw-worker.js` and `ngsw.json`. Development mode intentionally does not register
the service worker. Use `npm run serve:pwa` for browser installation/offline checks.
The existing helper uses `http-server` through `npx`, as before.

## Deployment (manual; no infrastructure changes applied)

### Existing Vercel frontend

Keep the current Vercel project and domain. After deployment approval:

1. Set **Root Directory** to `apps/web` and enable **Include source files outside
   of the Root Directory in the Build Step**, making the workspace lockfile available.
2. Use a supported Node version above and npm 10.9.4.
3. `apps/web/vercel.json` installs from the repository root with
   `npm ci --workspace apps/web`, builds with `npm run build:prod`, and publishes
   `dist/save-to-dream/browser` relative to `apps/web`.
4. Remove/update any conflicting old dashboard overrides; validate a preview first.

The existing `/api/:path*` rewrite still targets
`https://wallet-app-nest.onrender.com/api/:path*`. The browser production API origin
remains `https://wallet-app-nest.onrender.com`. Retain the current frontend origin
and OAuth callback settings. See [Vercel monorepo settings](https://vercel.com/docs/monorepos/monorepo-faq).

### Existing Render backend

`render.yaml` records the new build paths as a reference with auto-deploy disabled.
Do not apply it to create a replacement service. After deployment approval,
update the **existing** `wallet-app-nest` service to use `ayankz/money-tracker`
and the approved deployment branch, with:

- Root Directory: repository root (blank).
- Dockerfile Path: `./apps/api/Dockerfile`.
- Docker Build Context Directory: `.`.
- Start command: Dockerfile default (`node dist/main.js` in `/app/apps/api`).
- Health check: `/api/health`.

Keep the service identity, `wallet-app-nest.onrender.com` domain, database, region,
plan and all environment variables unchanged. No database migration is run by the
image's startup command. For a future approved schema deployment, run the root
`npm run prisma:migrate:deploy` with the intended database configuration in a build
environment containing Prisma CLI; the production image omits development tools.
See [Render monorepo paths](https://render.com/docs/monorepo-support).

```sh
docker build -f apps/api/Dockerfile -t money-tracker-api .
# Supply your existing configuration at runtime, never at image build time:
docker run --rm --env-file /secure/path/api.env -p 3333:3333 money-tracker-api
```

The old EC2 workflow is archived in `docs/legacy-ec2-deploy.yml`, still fully
commented out. It does not deploy anything. The original backend repository remains unchanged.

## Migration history and validation

The feature branch is `chore/monorepo-migration`. Angular history remains intact.
Backend `main` was imported with unsquashed `git subtree add --prefix=apps/api`:
its original commits are ancestors of the import merge, with their original hashes.
Historical backend commits still show their original root paths; use the import's
second parent to inspect that history. Tags and other backend branches were not
imported. This is a one-time consolidation; it does not configure automatic syncing.

See [migration validation and known baseline failures](docs/monorepo-migration.md).
