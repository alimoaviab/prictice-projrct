FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* turbo.json tsconfig.base.json ./
COPY shared/package.json ./shared/package.json
COPY school-app/package.json ./school-app/package.json
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm --workspace school-app run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/school-app ./school-app
COPY --from=builder /app/package.json ./package.json
WORKDIR /app/school-app
EXPOSE 3000
CMD ["npm", "run", "start"]
