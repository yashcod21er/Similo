# Similo API and monitoring worker. Build from the repository root:
#   docker build -f backend/Dockerfile --target api .
#   docker build -f backend/Dockerfile --target worker .

# ---- build: compile TypeScript, then keep only production dependencies ----
FROM node:24-bookworm-slim AS build
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
WORKDIR /repo
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace @similo/backend --include=dev
COPY backend backend
RUN npm run build --workspace @similo/backend \
  && npm prune --workspace @similo/backend --omit=dev \
  && mkdir -p backend/node_modules

# ---- api: the REST API (no browser needed) ----
FROM node:24-bookworm-slim AS api
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/package.json ./
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/backend/package.json backend/
COPY --from=build /repo/backend/node_modules backend/node_modules
COPY --from=build /repo/backend/dist backend/dist
USER node
WORKDIR /repo/backend
EXPOSE 4000
CMD ["node", "dist/server.js"]

# ---- worker: scans and page capture. The Playwright image already contains
# Chromium and its system libraries; its version must match the `playwright`
# version in backend/package.json. ----
FROM mcr.microsoft.com/playwright:v1.65.0-noble AS worker
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/package.json ./
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/backend/package.json backend/
COPY --from=build /repo/backend/node_modules backend/node_modules
COPY --from=build /repo/backend/dist backend/dist
# Suspect pages are opened by this process, so it never runs as root.
USER pwuser
WORKDIR /repo/backend
CMD ["node", "dist/worker.js"]
