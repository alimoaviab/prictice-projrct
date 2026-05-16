# Multi-stage build for the React + Vite frontend.
#
# Stage 1: install deps and build the static bundle.
# Stage 2: serve through nginx with API requests proxied to the backend
# container ("backend-go") on port 8080.

FROM public.ecr.aws/docker/library/node:22-alpine AS builder

WORKDIR /app

# Cache npm install on its own layer.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

# Vite build is fully self-contained — no env vars are baked in beyond what
# is in .env at build time. The frontend hits "/api/*" and the nginx config
# below routes those calls to the backend container.
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=/api
ENV VITE_API_PROXY_TARGET=
ENV VITE_ENABLE_MOCKS=false

RUN npm run build

# ──────────────────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
