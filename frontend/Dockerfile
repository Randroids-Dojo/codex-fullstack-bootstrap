# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

WORKDIR /app

# Ensure npm picks the correct platform binary for native deps like esbuild
ENV npm_config_platform=linux \
    npm_config_arch=arm64

# Install deps first to leverage Docker layer cache
COPY package.json package-lock.json* ./
# install all deps including dev (vite)
# Improve reliability of installs & ensure native deps (esbuild) match the
# target platform. Occasionally a `package-lock.json` created on macOS can pin
# the darwin binary of esbuild, which then crashes in the Linux container. We
# explicitly rebuild esbuild after `npm ci` to guarantee the correct binary is
# present.
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 4 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set registry https://registry.npmmirror.com \
    && npm ci --no-audit --progress=false \
    # ensure any residual non-linux esbuild artifacts are removed
    && rm -rf node_modules/@esbuild/darwin-* node_modules/@esbuild/windows-* node_modules/@esbuild/freebsd-* \
    # rebuild to fetch the correct platform binary
    && npm rebuild esbuild

COPY . .

# Default command starts Vite dev server. For prod build you can override with
# `npm run build` and serve the `dist/` folder behind Nginx.
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
