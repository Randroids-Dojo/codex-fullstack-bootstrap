FROM node:20-alpine as base

# Set workdir
WORKDIR /app

# Copy package manifests first for better cache utilisation
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies (if lockfile present)
# Alpine + esbuild sometimes ship mismatched binary variants after npm ci; force
# a rebuild so the embedded Go binary matches the JS wrapper version.
RUN if [ -f package-lock.json ]; then npm ci && npm rebuild esbuild; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile && npm rebuild esbuild; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile && npm rebuild esbuild; \
    else npm install; fi

# Copy source
COPY . .

# Build for production
RUN npm run build

# -------- Runtime image --------
FROM node:20-alpine
WORKDIR /app
COPY --from=base /app /app

# Expose the default Vite preview port (dist server)
EXPOSE 4173

# Default command (dev if NODE_ENV=development else preview)
ENV NODE_ENV=production
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npm run dev -- --host 0.0.0.0; else npm run preview -- --host 0.0.0.0; fi"]
