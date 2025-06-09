FROM node:20-bookworm as base

# Set workdir
WORKDIR /app

# Copy package manifests first for better cache utilisation
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Disable Rollup native binary lookup and install all deps
ENV ROLLUP_NO_BINARY=true ROLLUP_NO_NATIVE=true ROLLUP_WATCH=true
# Install dependencies (respect any lockfile)
RUN npm install

# Copy source
COPY . .

# In dev-container mode we skip the production build and run Vite directly.
# If you do want a static build, uncomment the following two lines and adjust
# the runtime stage accordingly.
# RUN npm run build

# -------- Runtime image --------
FROM node:20-bookworm
WORKDIR /app
COPY --from=base /app /app

# Disable Rollup native binary at runtime as well
ENV ROLLUP_NO_BINARY=true ROLLUP_NO_NATIVE=true ROLLUP_WATCH=true

# Expose Vite dev port
EXPOSE 3000

# Run Vite dev server by default (can be overridden by docker-compose command)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
