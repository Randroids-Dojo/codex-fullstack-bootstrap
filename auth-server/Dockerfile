FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./

# You may use your preferred package manager; we'll default to npm for simplicity
RUN npm install --silent || true

COPY src ./src

CMD ["npm", "run", "start"]
