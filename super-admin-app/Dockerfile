# Multi-stage build for the Super Admin React + Vite frontend.
FROM public.ecr.aws/docker/library/node:22-alpine AS builder

WORKDIR /app

# Cache npm install on its own layer.
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

# Vite build
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=/api

RUN npm run build

# ──────────────────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
