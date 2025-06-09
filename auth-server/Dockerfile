FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies (fail if any dependency fails to install!)
RUN npm install --silent --include=dev

COPY src ./src

CMD ["npm", "run", "start"]
