FROM node:20-slim as base

# Set workdir
WORKDIR /app

# Copy package manifests first for better cache utilisation
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies (if lockfile present)
RUN if [ -f package-lock.json ]; then npm ci && npm install; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable && pnpm install --frozen-lockfile; \
    else npm install; fi

# --- Temporary workaround for Rollup native optional dependency issue on ARM builds
RUN ARCH=$(node -p "process.arch") && PLATFORM=$(node -p "process.platform") && \
    if [ "$PLATFORM" = "linux" ]; then \
      if [ "$ARCH" = "arm64" ]; then PKG="@rollup/rollup-linux-arm64-gnu"; \
      elif [ "$ARCH" = "x64" ]; then PKG="@rollup/rollup-linux-x64-gnu"; fi; \
    elif [ "$PLATFORM" = "darwin" ]; then \
      if [ "$ARCH" = "arm64" ]; then PKG="@rollup/rollup-darwin-arm64"; \
      elif [ "$ARCH" = "x64" ]; then PKG="@rollup/rollup-darwin-x64"; fi; \
    fi && \
    if [ -n "$PKG" ]; then echo "Installing rollup native binary $PKG" && npm install --no-save "$PKG"; else echo "No native rollup binary mapping for $PLATFORM-$ARCH"; fi

# Copy source
COPY . .

# Build for production
RUN npm run build

# -------- Runtime image --------
FROM node:20-slim
WORKDIR /app
COPY --from=base /app /app

# Expose the default Vite preview port (dist server)
EXPOSE 4173

# Default command (dev if NODE_ENV=development else preview)
ENV NODE_ENV=production
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = \"development\" ]; then npm run dev -- --host 0.0.0.0; else npm run preview -- --host 0.0.0.0; fi"]
