# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

WORKDIR /app

COPY package.json .
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 4 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set registry https://registry.npmmirror.com \
    && npm install --production=false --no-audit --progress=false

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine AS prod

WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/package.json .
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

CMD ["node", "dist/server.js"]
