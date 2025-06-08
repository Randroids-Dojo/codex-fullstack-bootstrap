# Frontend – React + Vite + TypeScript

This directory contains a **minimal, ready-to-run React application** used by the hello-world full-stack bootstrap.

Key tech:

* React 18 + TypeScript
* Vite for dev server & build
* React-Router v6 for routing
* Axios with an interceptor that automatically attaches the JWT access-token

Pages implemented:

1. **/login** – E-mail/password sign-in (+ sign-up toggle). Stores `access_token` in `localStorage` and React context.
2. **/dashboard** – Displays current user profile and the global counter. Provides an “Increment” button and a Logout action.

Environment variables consumed via Vite **(injected automatically when you run through `docker compose`)**

```
VITE_AUTH_URL=http://localhost:4000/auth
VITE_API_URL=http://localhost:8000
```

---

## Local development

```bash
# one-off install
cd frontend
npm install

# start vite
npm run dev -- --host 0.0.0.0
```

Navigate to http://localhost:3000.

---

## Production build

```
npm run build   # outputs to dist/
npm run preview # serves dist/ on :4173
```

The Dockerfile already performs the production build and runs `vite preview` in production or `vite dev` in development.
