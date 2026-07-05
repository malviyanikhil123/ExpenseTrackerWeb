# ----------------------------
# Base Image
# ----------------------------
FROM node:20-bookworm-slim AS base

WORKDIR /app

# ----------------------------
# Dependencies
# ----------------------------
FROM base AS deps

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

# ----------------------------
# Build
# ----------------------------
FROM deps AS build

COPY tsconfig*.json ./
COPY drizzle.config.ts ./

COPY src ./src
COPY drizzle ./drizzle

RUN npm run build

RUN npm prune --omit=dev

# ----------------------------
# Production
# ----------------------------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 5003

USER node

CMD ["node", "dist/server.js"]