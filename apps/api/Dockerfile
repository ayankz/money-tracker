# Build from the repository root: docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --workspace apps/api --no-audit --no-fund
COPY apps/api ./apps/api
RUN npm run build:api

FROM node:20-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN PRISMA_SKIP_POSTINSTALL_GENERATE=true npm ci --workspace apps/api --omit=dev --no-audit --no-fund
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules/.prisma ./apps/api/node_modules/.prisma
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
EXPOSE 3333
CMD ["node", "dist/main.js"]
