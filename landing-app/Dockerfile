# Multi-stage build for the public landing site (React + Vite).
FROM node:22-alpine AS builder

WORKDIR /app

# Cache npm install on its own layer.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

# Vite build
ENV NODE_ENV=production

# Default the school SPA URL to the local docker port. Override at
# build time with --build-arg APP_URL=https://app.example.com.
ARG APP_URL=http://localhost:3000
ENV VITE_APP_URL=$APP_URL

RUN npm run build

# ──────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
