# Comprehensive Better-Auth Implementation Plan

Based on extensive research of the latest Better-Auth documentation (v1.x as of June 2025) and learning from our previous failed attempts, this document provides a definitive guide to implementing Better-Auth with PostgreSQL, Express, FastAPI, and React.

## Executive Summary

Better-Auth is now a YC-backed company (Spring 2025 batch) with 14k+ stars and 1.5M+ downloads. It provides a comprehensive authentication framework for TypeScript that works directly with your database using Kysely under the hood.

## Key Insights from Documentation Research

### 1. Database Integration
- Better-Auth uses **Kysely** internally for database queries
- PostgreSQL is fully supported via the built-in adapter (no separate package needed)
- Pass a `pg.Pool` instance directly - Better-Auth wraps it with Kysely
- Tables created: `user` (singular!), `session`, `account`, `verification`

### 2. Express Integration Requirements
- **CRITICAL**: Do NOT use `express.json()` before the Better-Auth handler
- Use `toNodeHandler` from `better-auth/node` (not from main package)
- Careful with `basePath` vs Express mount path

### 3. Email/Password Configuration
- Configure via `emailAndPassword` option (NOT under `providers`)
- `enabled: true` is required
- Options: `autoSignIn`, `requireEmailVerification`, `minPasswordLength`, etc.

### 4. Client SDK Status
- `@better-auth/client` is still in beta (0.0.2-beta.8)
- API is unstable - recommend using fetch/axios for now

## Phase 1: Auth-Server Setup

### 1.1 Install Packages
```bash
cd auth-server
npm install better-auth@latest
# No adapter packages needed - PostgreSQL support is built-in
```

### 1.2 Correct Configuration
```typescript
// auth-server/src/index.ts
import express from 'express';
import cors from 'cors';
import { betterAuth } from 'better-auth';
import { toNodeHandler } from 'better-auth/node';
import { Pool } from 'pg';
import { env } from './env.js';

async function bootstrap() {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  
  const auth = betterAuth({
    // Database - Better-Auth wraps this with Kysely
    database: pool,
    
    // URL configuration
    baseURL: env.PUBLIC_URL || 'http://localhost:4000',
    basePath: '/api/auth', // All auth routes under this path
    
    // Secret for signing tokens
    secret: env.BETTER_AUTH_SECRET,
    
    // Email/password configuration (NOT under providers!)
    emailAndPassword: {
      enabled: true,
      autoSignIn: true, // Auto sign-in after signup
      requireEmailVerification: false, // For MVP
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },
    
    // Session configuration
    session: {
      expiresIn: 604800, // 7 days in seconds
      updateAge: 86400,  // Update if older than 1 day
    },
    
    // Logging
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });
  
  const app = express();
  
  // CORS middleware BEFORE Better-Auth
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  }));
  
  // Mount Better-Auth handler - NO express.json() before this!
  app.use(toNodeHandler(auth));
  
  // NOW we can add express.json() for other routes
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  
  app.listen(env.PORT, () => {
    console.log(`Auth-server listening on ${env.PORT}`);
  });
}

bootstrap().catch(console.error);
```

### 1.3 Environment Configuration
```typescript
// auth-server/src/env.ts
import 'dotenv/config';

export const env = {
  PORT: Number(process.env.AUTH_PORT || 4000),
  DATABASE_URL: process.env.DATABASE_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  PUBLIC_URL: process.env.PUBLIC_URL || `http://localhost:${process.env.AUTH_PORT || 4000}`,
};
```

### 1.4 Run Migrations
```bash
npx better-auth migrate
```

### 1.5 Expected Endpoints
With `basePath: '/api/auth'`:
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-in/email`
- `GET /api/auth/session`
- `POST /api/auth/sign-out`

## Phase 2: Database Schema

### 2.1 Better-Auth Tables (created automatically)
- `user` (NOT `users`!)
    - `id` (string, primary key)
    - `email` (string, unique)
    - `name` (string)
    - `emailVerified` (boolean)
    - `createdAt` (timestamp)
    - `updatedAt` (timestamp)

- `session`
    - `id` (string)
    - `userId` (string, FK to user)
    - `expiresAt` (timestamp)
    - `token` (string)

- `account` (for OAuth and passwords)
    - `id` (string)
    - `userId` (string, FK to user)
    - `providerId` (string)
    - `accountId` (string)
    - `password` (string, nullable)

### 2.2 Application Tables
```sql
-- Link app-specific data to Better-Auth users
CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  -- Add your custom fields here
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_app_users_user_id ON app_users(user_id);
```

## Phase 3: Backend (FastAPI) Integration

### 3.1 Session Validation (Recommended)
```python
# backend/app/deps.py
from fastapi import Depends, Header, HTTPException, status
import httpx
from sqlalchemy.orm import Session
from .settings import settings
from .database import get_db
from . import crud

async def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """Validate session with auth-server and get/create local user."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.AUTH_SERVER_URL}/api/auth/session",
            headers={"Authorization": authorization},
            timeout=5.0
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session"
            )
        
        session_data = response.json()
        user_data = session_data.get("user", {})
        
        # Get or create local user record
        user = crud.get_or_create_user_from_auth_id(
            db,
            auth_user_id=user_data["id"],
            email=user_data.get("email"),
            name=user_data.get("name")
        )
        
        return user
```

### 3.2 Update Models
```python
# backend/app/models.py
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .database import Base

class AppUser(Base):
    __tablename__ = "app_users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, unique=True, nullable=False)  # Better-Auth user ID
    email = Column(String)
    name = Column(String)
    created_at = Column(DateTime, server_default="NOW()")
```

### 3.3 Environment Variables
```env
# Internal Docker DNS name for auth-server
AUTH_SERVER_URL=http://auth-server:4000
```

## Phase 4: Frontend Integration

### 4.1 Simple Fetch-based Auth (Recommended)
```typescript
// frontend/src/lib/auth.ts
const AUTH_BASE_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:4000';

export async function signUp(email: string, password: string, name: string) {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important for cookies
    body: JSON.stringify({ email, password, name }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sign up failed');
  }
  
  return response.json();
}

export async function signIn(email: string, password: string) {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Sign in failed');
  }
  
  return response.json();
}

export async function getSession() {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/session`, {
    credentials: 'include',
  });
  
  if (!response.ok) return null;
  return response.json();
}

export async function signOut() {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include',
  });
  
  return response.ok;
}
```

### 4.2 Axios Configuration for API Calls
```typescript
// frontend/src/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, // Send cookies with requests
});

// Session is managed by cookies, so we just need to ensure credentials are included
api.interceptors.request.use((config) => {
  config.withCredentials = true;
  return config;
});
```

### 4.3 React Auth Context
```typescript
// frontend/src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSession, signIn, signUp, signOut } from '../lib/auth';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const session = await getSession();
      setUser(session?.user || null);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    await signIn(email, password);
    await refreshSession();
  };

  const handleSignUp = async (email: string, password: string, name: string) => {
    await signUp(email, password, name);
    await refreshSession();
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        signIn: handleSignIn, 
        signUp: handleSignUp, 
        signOut: handleSignOut,
        refreshSession 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

## Phase 5: Testing & Verification

### 5.1 Test Auth-Server Endpoints
```bash
# Sign up
curl -X POST http://localhost:4000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Sign in
curl -X POST http://localhost:4000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"password123"}'

# Get session (using cookies from sign-in)
curl http://localhost:4000/api/auth/session \
  -b cookies.txt

# Sign out
curl -X POST http://localhost:4000/api/auth/sign-out \
  -b cookies.txt
```

### 5.2 Verify Database
```sql
-- Check Better-Auth tables
SELECT * FROM "user";
SELECT * FROM session;
SELECT * FROM account;

-- Check app tables
SELECT * FROM app_users;
```

## Environment Variables

### Complete .env Template
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app
REDIS_URL=redis://redis:6379/0

# Auth Server
BETTER_AUTH_SECRET=<generate-with-openssl-rand-base64-32>
PUBLIC_URL=http://localhost:4000
CORS_ORIGIN=http://localhost:3000
AUTH_PORT=4000

# Frontend
VITE_AUTH_URL=http://localhost:4000
VITE_API_URL=http://localhost:8000
FRONTEND_PORT=3000

# Backend
AUTH_SERVER_URL=http://auth-server:4000
BACKEND_PORT=8000
```

### Generate Secret
```bash
openssl rand -base64 32
```

## Common Pitfalls & Solutions

### ❌ DON'T
1. **Don't use `express.json()` before Better-Auth handler**
    - Body parsing interferes with Better-Auth's request handling

2. **Don't confuse `basePath` with Express mount path**
    - If you mount at `/api` and set `basePath: '/auth'`, routes are at `/api/auth/*`
    - If you mount at root and set `basePath: '/api/auth'`, routes are at `/api/auth/*`

3. **Don't expect stable client SDK**
    - `@better-auth/client` is still in beta (0.0.2-beta.8)
    - API changes frequently - use fetch/axios instead

4. **Don't use old configuration format**
    - Wrong: `providers: { emailPassword: {...} }`
    - Right: `emailAndPassword: {...}`

5. **Don't expect `users` table**
    - Better-Auth creates `user` (singular), not `users`

6. **Don't store tokens manually**
    - Better-Auth uses secure httpOnly cookies
    - Just use `credentials: 'include'` in your requests

### ✅ DO
1. **Test with curl first**
    - Verify endpoints work before frontend integration

2. **Use cookies for session management**
    - Always include `credentials: 'include'` or `withCredentials: true`

3. **Handle the `name` field**
    - Required for sign-up in Better-Auth
    - Can be email username as fallback

4. **Use the built-in PostgreSQL support**
    - No adapter package needed
    - Just pass a pg.Pool instance

5. **Check logs for debugging**
    - Set `logger: { level: 'debug' }` in development

## Migration Path from Current Implementation

### Step 1: Update Auth-Server
1. Remove current `authRouter.ts`
2. Update `index.ts` with Better-Auth configuration
3. Run migrations to create Better-Auth tables
4. Test endpoints with curl

### Step 2: Update Backend
1. Update `deps.py` to validate sessions with auth-server
2. Create `app_users` table linked to Better-Auth users
3. Update CRUD operations to use new user structure

### Step 3: Update Frontend
1. Replace current auth API calls with new endpoints
2. Update to use cookie-based sessions
3. Add `name` field to signup form
4. Ensure all requests include credentials

### Step 4: Data Migration (if needed)
```sql
-- Migrate existing users to Better-Auth structure
-- This is a one-time migration script
INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
SELECT 
  sub as id,
  email,
  name,
  true as "emailVerified",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM users;

-- Create account entries for password users
INSERT INTO account (id, "userId", "providerId", "accountId")
SELECT 
  gen_random_uuid() as id,
  sub as "userId",
  'credential' as "providerId",
  email as "accountId"
FROM users;
```

## Docker Compose Updates

```yaml
# docker-compose.yaml
services:
  auth-server:
    build: ./auth-server
    command: npm run dev
    env_file:
      - .env
    environment:
      - NODE_ENV=development
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
```

## Production Considerations

### 1. Security
- Use strong `BETTER_AUTH_SECRET` (min 32 bytes)
- Set `requireEmailVerification: true` in production
- Configure proper CORS origins (not `*`)
- Use HTTPS for all services

### 2. Session Management
- Consider Redis for session storage at scale
- Configure appropriate session expiry
- Implement session refresh logic

### 3. Email Verification
```typescript
// Add email sending configuration
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  sendVerificationEmail: async ({ user, url, token }) => {
    // Integrate with your email service
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      html: `<a href="${url}">Click here to verify</a>`
    });
  },
}
```

### 4. Password Reset
```typescript
// Add password reset configuration
emailAndPassword: {
  // ... other options
  sendResetPasswordEmail: async ({ user, url, token }) => {
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html: `<a href="${url}">Click here to reset</a>`
    });
  },
}
```

## Debugging Guide

### Common Issues

1. **"Cannot POST /api/auth/sign-up/email" (404)**
    - Check mount path vs basePath configuration
    - Verify the exact URL structure

2. **Request hangs indefinitely**
    - Remove `express.json()` before Better-Auth handler
    - Check middleware order

3. **"Invalid CSRF token"**
    - Ensure `credentials: 'include'` on all requests
    - Check CORS configuration

4. **Session not persisting**
    - Verify cookies are being set (check DevTools)
    - Ensure same-origin or proper CORS setup
    - Check cookie domain settings

### Debugging Tools

1. **Better-Auth Debug Logs**
   ```typescript
   logger: {
     level: 'debug',
     handler: (level, message, data) => {
       console.log(`[${level}] ${message}`, data);
     }
   }
   ```

2. **Database Inspection**
   ```sql
   -- Check active sessions
   SELECT s.*, u.email 
   FROM session s 
   JOIN "user" u ON s."userId" = u.id 
   WHERE s."expiresAt" > NOW();
   ```

3. **HTTP Request Debugging**
   ```bash
   # Verbose curl for debugging
   curl -v -X POST http://localhost:4000/api/auth/sign-in/email \
     -H "Content-Type: application/json" \
     -c cookies.txt \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Conclusion

This plan addresses all the issues discovered in our previous attempts and aligns with the latest Better-Auth documentation. The key insights are:

1. Better-Auth has evolved significantly and is now a mature, well-funded project
2. The configuration API has changed - particularly for email/password
3. PostgreSQL support is built-in via Kysely
4. The client SDK is still unstable - use traditional HTTP methods
5. Cookie-based sessions are the recommended approach

By following this plan step-by-step and avoiding the documented pitfalls, you should achieve a successful Better-Auth integration with your PostgreSQL, Express, FastAPI, and React stack.
