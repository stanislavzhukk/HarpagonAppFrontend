# Harpagon Frontend

Angular 22 + Tailwind 4 client for the HarpagonApp .NET API. English and Polish only.

## Run locally

```bash
npm install
npm start            # http://localhost:4200, /api is proxied to http://localhost:8080 (see proxy.conf.json)
npm test             # vitest
npm run build        # production bundle in dist/
```

The API must be running on `localhost:8080`. Change the target in `proxy.conf.json` if yours differs.

## Run with Docker

```bash
cp .env.example .env
docker compose up --build                      # frontend only; set API_UPSTREAM in .env
docker compose --profile backend up --build    # + API, Postgres, Mailpit (needs BACKEND_CONTEXT)
```

The browser only talks to nginx. nginx serves the SPA and forwards `/api/*` to `API_UPSTREAM` with the
`/api` prefix stripped, so there is no CORS setup and the API is never exposed directly. For an API running on
the host use `API_UPSTREAM=http://host.docker.internal:8080`.

The `backend` profile builds the API from a separate checkout (`BACKEND_CONTEXT`, default `../HarpagonApp`) and does
not modify it. Its environment variable names (`ConnectionStrings__DefaultConnection`, `Jwt__SecretKey`,
`Frontend__Url`, `Smtp__*`) are assumptions: adjust them in `compose.yaml` to match the backend configuration.
`FRONTEND_URL` must be the public URL of the frontend, because confirmation and reset e-mails link to it.

## Structure

```
src/app/
  core/      api (interceptor, ApiError, models), auth, i18n (en.ts / pl.ts), theme, toast
  features/  auth, dashboard, transactions, accounts, categories, settings, setup, admin
  layout/    shell (sidebar / bottom nav), auth layout
  shared/    ui components, form helpers, date helpers
```

- **Errors**: every failed request becomes an `ApiError` (`{ message, errors[] }` from the API). Server text is shown as is
  (the API localises it from `Accept-Language`); network, 5xx and auth failures use translated copy. Forms opt out of the
  global toast with `silent()` and show an inline banner instead.
- **i18n**: `TranslationKey` is derived from `en.ts`, so a missing PL key is a compile error. A test checks key parity
  and placeholders.
- **Auth**: access and refresh tokens, single-flight refresh on 401, role from the user object or the JWT.
