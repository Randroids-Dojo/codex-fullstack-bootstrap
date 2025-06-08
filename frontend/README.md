# Frontend (React + Vite + TypeScript + shadcn-ui)

The full React codebase is not included in this skeleton to keep the demo minimal and fast to clone.  
You can scaffold it quickly with the following commands:

```bash
# one-time project creation – run from repo root
npm create vite@latest frontend -- --template react-ts
cd frontend && pnpm dlx shadcn-ui@latest init --typescript

# install deps & start dev server
pnpm install
pnpm dev --host 0.0.0.0
```

Make sure to export the following Vite env vars (they are provided automatically when you run through `docker compose`):

```
VITE_AUTH_URL=http://localhost:4000/auth
VITE_API_URL=http://localhost:8000
```

Implement two simple pages:
1. `/login` – collects email + password, calls `${VITE_AUTH_URL}/signup` or `/login`, stores `access_token` on success.
2. `/dashboard` – shows the authenticated user info (`/me`) and global counter with “Increment” button.

