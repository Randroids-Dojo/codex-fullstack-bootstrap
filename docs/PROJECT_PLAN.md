# Minimal Full-Stack Hello-World Bootstrap

Stack:
- **Frontend:** React + TypeScript + Vite + shadcn-ui
- **Auth-server:** Better Auth (open-source TS framework) running on Node/Express
- **Backend:** FastAPI (Python) for business APIs
- **Database:** PostgreSQL (single instance shared by auth & backend)
- **Cache / sessions:** Redis (shared)
- **Container Orchestration:** Docker Compose (dev) – Azure Container Apps / App Service for prod

> Goal: keep features to the bare minimum (signup/login, user profile, global counter) while giving a ready-to-extend monolith that works locally and can ship to Azure unchanged.

---
## 1  Architecture Overview
```
 browser ─► React (3000)
            │
            ▼
           /auth/*  ─► Better Auth TS server (4000) ──┐
                                      │             │
                                      │ JWT (HS256) │ shared Postgres & Redis
                                      ▼             ▼
           /api/*   ─► FastAPI (8000)  ◄─────────────┘
```
- Better Auth issues **HS256-signed JWTs** using a secret shared with FastAPI.
- Redis is used by Better Auth for sessions/refresh tokens; FastAPI may reuse it for caching.
- All services live in one repo and one Compose file.

---
## 2  Repository Layout
```
.
├── auth-server/            # Node + TypeScript + Better Auth
│   ├── src/
│   │   ├── index.ts        # Express bootstrap
│   │   ├── better-auth.ts  # Better Auth config
│   │   └── env.ts
│   └── Dockerfile
├── backend/                # FastAPI, Alembic, tests
├── frontend/               # React + Vite + shadcn
├── docker-compose.yaml
├── .env.template
└── infra/                  # optional Azure scripts & CI workflow
```

---
## 3  docker-compose.yaml (dev)
```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes: [dbdata:/var/lib/postgresql/data]

  redis:
    image: redis:7

  auth-server:
    build: ./auth-server
    command: npm run dev           # ts-node-dev
    env_file: [.env]
    ports: ["4000:4000"]
    depends_on: [postgres, redis]

  backend:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    env_file: [.env]
    ports: ["8000:8000"]
    depends_on: [auth-server, postgres, redis]

  frontend:
    build: ./frontend
    command: yarn dev --host 0.0.0.0
    env_file: [.env]
    ports: ["3000:3000"]
    depends_on: [auth-server, backend]

volumes:
  dbdata:
```

---
## 4  Environment Variables (`.env.template` excerpt)
```
# shared
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
REDIS_URL=redis://redis:6379/0
JWT_SECRET=super-long-random-string

# service ports (optional override)
AUTH_PORT=4000
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

---
## 5  Auth-server Implementation (Node/TS)
```ts
// src/env.ts
export const env = {
  PORT: Number(process.env.AUTH_PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
  ISSUER: "better-auth-demo",
};

// src/better-auth.ts
import { createBetterAuth } from "better-auth";
import { env } from "./env";

export const betterAuth = createBetterAuth({
  db: { url: env.DATABASE_URL, driver: "postgres" },
  redis: { url: env.REDIS_URL },
  jwt: {
    secret: env.JWT_SECRET,
    algorithm: "HS256",
    expiresIn: "15m",
    issuer: env.ISSUER,
    audience: "fastapi-backend",
  },
  providers: ["email-password"],
});

// src/index.ts
import express from "express";
import { betterAuth } from "./better-auth";
import { env } from "./env";

const app = express();
app.use(express.json());
app.use("/auth", betterAuth.router);

app.listen(env.PORT, () => console.log(`Auth-server on ${env.PORT}`));
```

---
## 6  FastAPI Changes
```python
# app/deps.py
from fastapi import Header, HTTPException, status
from jose import jwt, JWTError
from .settings import settings

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    token = authorization[len("Bearer "):].strip()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=["HS256"],
            audience="fastapi-backend",
            issuer="better-auth-demo",
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    user = crud.user.get_or_create_from_sub(payload["sub"], payload.get("email"), payload.get("name"))
    return user
```

Backend routes:
- `GET /health` – sanity probe
- `GET /me` – returns current user record
- `GET /counter` – current global value
- `POST /counter/increment` – increments & returns new total

---
## 7  Frontend Flow (React + shadcn)
1. `VITE_AUTH_URL=http://localhost:4000/auth` and `VITE_API_URL=http://localhost:8000` in Vite env.
2. Login page posts to `/auth/signup` or `/auth/login`.
3. On success store `access_token` (localStorage or memory).
4. Axios interceptor attaches `Authorization: Bearer <token>` when calling backend `/api/*`.
5. Dashboard shows user profile & global counter, “Increment” button posts to backend.

---
## 8  Development Quick-start
```bash
cp .env.template .env    # fill JWT_SECRET etc.
docker compose up --build
```
Open http://localhost:3000 → sign up → dashboard → increment counter.

---
## 9  Azure Deployment Notes
- Build three images (auth-server, backend, frontend) in CI.
- Deploy with Azure Container Apps or Web App for Containers using a `docker-compose.azure.yaml`.
- Use Azure Database for PostgreSQL Flexible Server & Azure Cache for Redis; inject URLs + `JWT_SECRET` via secrets.

---
## 10  Future Extensions
- Social login providers in Better Auth config.
- Switch to `RS256` with JWKS endpoint.
- Celery worker (Python) with Redis broker for async tasks.
- Real-time counter via WebSocket (FastAPI + Redis pub/sub).

---
_End of plan – ready to implement._

---
## 11  Post-mortem: first Better-Auth attempt (2025-06-09)

Our initial migration to Better-Auth hit several snags.  Documenting them here
so the second pass is deliberate.

### What broke

| Area | Symptom | Root cause |
|------|---------|------------|
| Route mounting | Requests reached Express but hung (no status) | `express.json()` consumed the body *before* Better-Auth’s handler. |
| Provider flags | `EMAIL_AND_PASSWORD_SIGN_UP_IS_NOT_ENABLED` | Used outdated option names (`allowSignUp`, `emailAndPassword`). |
| Adapter | Build failed on `@better-auth/adapter-postgresql` | Package doesn’t exist – docs outdated. |
| CORS | Cookie requests failed | Wildcard `*` origin used while `withCredentials:true`. |
| Session endpoint | Backend 404 on `/get-session` | Current endpoint is `/session`. |
| Handler | 404 / empty response | Passed `auth.handler` instead of whole `auth` object to `toNodeHandler`. |

### Second-pass plan (short)

1. Re-read docs: core config, email/password, “Integrations → Express”.
2. Minimal reproducible config (see snippet below).  Verify with curl first.
3. Mount order: `app.use('/api', toNodeHandler(auth));` then `express.json()`.
4. Correct provider block:
   ```ts
   providers: {
     emailPassword: {
       enabled: true,
       enableSignUp: true,
       requireEmailVerification: false,
     },
   },
   ```
5. Backend hits `/api/auth/session` and caches result for 60 s.
6. Env vars: `BETTER_AUTH_SECRET`, `PUBLIC_URL`, drop JWT vars.
7. Add debug logging (`logLevel:'debug'`) only in dev.
8. Integration test in CI: sign-up → session → backend `/me` should return 200.

```ts
const auth = betterAuth({
  database: new Pool({ connectionString: env.DATABASE_URL }),
  baseURL : env.PUBLIC_URL,
  basePath: '/auth',
  secret  : env.BETTER_AUTH_SECRET,

  providers: {
    emailPassword: { enabled: true, enableSignUp: true },
  },

  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  cors: { enabled: false },
});

app.use('/api', toNodeHandler(auth));   //  /api/auth/**
app.use(express.json());
```

With these guard-rails we can attempt the integration again on a clean
feature branch.

