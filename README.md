# Full Stack "Hello World" Bootstrap

This repository contains a minimal yet functional full-stack monolithic web-application that demonstrates:

* React + TypeScript (Vite) front-end with TailwindCSS & shadcn/ui components
* A stand-alone **Better-Auth** service that handles email / password authentication
* FastAPI back-end that exposes two tiny API routes
  * `GET /me` – returns the currently authenticated user's e-mail
  * `POST /counter/increment` – atomically increments a global counter in Postgres
* PostgreSQL 16 with **Liquibase** migrations for deterministic DB state
* Docker Compose topologies for **development** and **production**

> The implementation follows the blueprint laid out in `docs/PROJECT_PLAN.md`.

## Prerequisites

* Docker ≥ 20.10 and Docker Compose v2

## Running locally (dev)

```bash
docker compose -f docker-compose.dev.yml up --build
# Front-end:  http://localhost:5173
# Auth API:   http://localhost:3001/api/auth/ok
# App  API:   http://localhost:8000/docs
```

## Production build

```bash
docker compose -f docker-compose.prod.yml up --build
# Nginx on http://localhost
```

## Extending the bootstrap

* Add more Liquibase XMLs under `migrations/` – they will be applied automatically.
* Drop additional **Better-Auth** plugins into `auth-service/src/server.ts` for social providers, RBAC, etc.
* Grow the FastAPI or React apps as required; they are regular, fully-featured projects.

Enjoy hacking! ✨
