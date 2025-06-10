# Better-Auth Integration – Full-stack Work-plan

This document is the authoritative, step-by-step procedure for integrating the upstream **better-auth** framework across *all* layers of the bootstrap project (auth-server, backend, database and frontend).

It reflects the latest upstream API (main @ 2025-06-10) and lessons learned in `docs/PROJECT_PLAN.md`.

---

## 0  Preparatory checklist

1. Upgrade runtimes – Node ≥ 18, Python ≥ 3.11.
2. Create the feature branch `better-auth-integration`.
3. Run `npx better-auth@latest doctor` to verify Postgres/Redis connectivity.
4. Copy `.env.sample` (see below) into `.env` and `.env.ci`; all Better-Auth variables are prefixed **BA_**.
5. Use the upstream *examples/express* repo as the gold reference. Any missing code is ported from there.

---

## 1  Auth-server layer (Node + Express)

### Status  
✅ **Completed – 2025-06-10** (commit: phase-1).  Hand-rolled bcrypt/JWT routes were removed; `better-auth` 1.2.8 is now wired up, migrations run automatically when Postgres is available, and the server falls back to the in-memory adapter during local dev.  The service responds to `/auth/**` and `/health` as expected.

### A. Packages & tooling

```bash
npm remove better-auth           # remove old beta
npm i better-auth@latest \
       @better-auth/adapter-postgres \
       @better-auth/adapter-redis

npx better-auth@latest migrate   # create / update tables
```

### B. Express bootstrap (`auth-server/src/index.ts`)

```ts
import express from "express";
import { BetterAuth, toNodeHandler } from "better-auth/express";
import { env } from "./env";

const auth = BetterAuth({
  baseURL : env.PUBLIC_URL,          // e.g. http://localhost:4000
  basePath: "/auth",
  secret  : env.BA_SECRET,

  adapters: {
    postgres: { connectionString: env.DATABASE_URL },
    redis   : { url: env.REDIS_URL },
  },

  providers: {
    emailPassword: {
      enabled: true,
      enableSignUp: true,
      requireEmailVerification: false,
    },
  },

  jwt: {
    enableJWT : true,
    algorithm : "HS256",   // switch to RS256 later
    audience  : "fastapi-backend",
    issuer    : "better-auth-demo",
    expiresIn : "15m",
  },

  logLevel: env.NODE_ENV === "production" ? "info" : "debug",
});

const app = express();
app.use("/auth", toNodeHandler(auth)); // mount *before* body-parser
app.use(express.json());

app.listen(env.PORT, () => console.log(`Auth-server on ${env.PORT}`));
```

### C. Definition of Done (auth-server)

* `POST /auth/sign-up/email` round-trip works (returns session + token).
* `GET /auth/session` returns JSON when supplied `Authorization: Bearer …`.
* Postgres tables `ba_users`, `ba_sessions`, `ba_verification_tokens` are present.

> **Endpoint naming gotcha**  
> Better-Auth uses hyphenated paths:  
> • Sign-up  `POST /auth/sign-up/email`  
> • Sign-in   `POST /auth/sign-in/email`  
> Legacy code called `/api/auth/signup|login`, which now returns **404**. Always use the official paths (or the `@better-auth/client` SDK) to avoid breakage.

---

## 2  Database layer (PostgreSQL)

1. Run `npx better-auth migrate` – idempotent, creates the `auth` schema.
2. Create application table linking to BA users:

```sql
create table app_users (
    id          uuid primary key default gen_random_uuid(),
    ba_user_id  uuid references auth.ba_users(id) on delete cascade,
    full_name   text,
    created_at  timestamptz default now()
);

create unique index on app_users(ba_user_id);
```

No further schema work is needed for the demo counter.

---

## 3  Backend layer (FastAPI)

### A. Dependency – current user

✅ Implemented (2025-06-10): the backend now supports both stateless HS256
verification **or** stateful `/auth/session` lookup, selectable via
`USE_JWT=true|false` (`settings.use_jwt`).  It reads `BA_SECRET` and
`AUTH_PUBLIC_URL` env vars so config matches the auth-server.

```python
from fastapi import Header, HTTPException, status
from jose import jwt, JWTError
from httpx import AsyncClient
from .settings import settings

# Stateless (JWT) path
async def get_current_user_jwt(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(
            token,
            settings.BA_SECRET,
            algorithms=["HS256"],
            audience="fastapi-backend",
            issuer="better-auth-demo",
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    return crud.user.get_or_create_from_sub(payload["sub"], payload.get("email"))

# Stateful (session) path – for RS256 or token revocation
ac = AsyncClient(base_url=settings.AUTH_PUBLIC_URL)

async def get_current_user_session(authorization: str = Header(...)):
    r = await ac.get("/auth/session", headers={"Authorization": authorization})
    if r.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    data = r.json()
    return crud.user.get_or_create_from_sub(data["user"]["id"], data["user"]["email"])
```

Switch via `USE_JWT=true` in settings.

### B. Routes remain identical – protect with one of the deps above.

### C. Integration tests (Pytest)

* Sign-up → token → `/me` → 200.
* Invalid / expired token → 401.

---

## 4  Frontend layer (React + Vite)

### A. Install SDK

```bash
# Install Better-Auth JS helper.  
yarn add @better-auth/client
```

> ❗ **Path mismatch gotcha**
> 
> Our original prototype hit `/api/auth/signup`.  After the switch to
> Better-Auth the correct email-password endpoints are **hyphenated** and live
> under `/auth` (no `/api` prefix):
> 
> • `POST /auth/sign-up/email`  – sign-up
> 
> • `POST /auth/sign-in/email`  – sign-in
> 
> Calling the legacy paths will return 404.  Use the `@better-auth/client`
> SDK (recommended) or update fetch/axios calls accordingly.

### B. Auth context provider

```tsx
import { createContext, useEffect, useState } from "react";
import { createBetterAuthClient } from "@better-auth/client";

export const auth = createBetterAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL, // http://localhost:4000/auth
  storage: 'local', // persisting token in localStorage
});

export const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    auth.session().then(setSession);
  }, []);

  return (
    <AuthCtx.Provider value={{ auth, session, setSession }}>
      {children}
    </AuthCtx.Provider>
  );
}
```

### C. Axios wrapper for backend

```ts
import axios from "axios";
import { auth } from "@/lib/auth";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(async (cfg) => {
  const { accessToken } = await auth.session();
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`;
  return cfg;
});
```

---

## 5  Dev / CI / Prod glue

### `.env.sample`

```dotenv
# ── Shared ───────────────────────────
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
REDIS_URL=redis://redis:6379/0
PUBLIC_URL=http://localhost:4000

# Better-Auth
BA_SECRET=super-long-random-string
BA_JWT_AUDIENCE=fastapi-backend
BA_JWT_EXPIRES_IN=15m

# Ports
AUTH_PORT=4000
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

* **docker-compose** – ensure `auth-server` uses the production command `node dist/index.js`.
* **GitHub Actions** – add a step `npx better-auth migrate` before service start.
* **Cypress** – end-to-end: sign-up, dashboard, increment counter.

---

## 6  Acceptance criteria

1. `make dev` starts stack; user can sign up & increment counter.
2. `pytest` passes locally & in CI.
3. DB migrations idempotent.
4. No PII logged in production.
5. `/auth/healthz` returns 200.
6. Test coverage of auth code ≥ 85 %.

---

## 7  Next tickets (out-of-scope)

* Switch JWT to **RS256** + JWKS; remove shared secret.
* Add OAuth providers (GitHub, Google).
* Replace demo counter with real domain logic.
* Add refresh-token rotation & device management UI.

---

_Last updated 2025-06-10_
