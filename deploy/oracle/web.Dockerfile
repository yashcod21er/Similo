# Website + HTTPS front door. Build from the repository root:
#   docker build -f deploy/oracle/web.Dockerfile .
# Caddy serves the built React app and forwards /api to the API container, so
# the browser sees one address (sign-in cookies need that).
FROM node:24-bookworm-slim AS build
WORKDIR /repo
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --workspace @similo/frontend --include=dev
COPY frontend frontend
# Empty = the app calls /api on its own address.
ENV VITE_API_BASE_URL=
RUN npm run build --workspace @similo/frontend

FROM caddy:2-alpine
COPY deploy/oracle/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /repo/frontend/dist /srv
