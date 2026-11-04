# ---------- Builder stage ----------
FROM node:20-alpine AS builder

# Рабочая директория
WORKDIR /app

# Устанавливаем зависимости (dev тоже нужны для сборки TS и prisma)
COPY package*.json ./
RUN npm ci

# Копируем всё приложение
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Сборка NestJS (TS → JS)
RUN npm run build


# ---------- Runtime stage ----------
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./

# ставим только прод-зависимости
RUN npm ci --omit=dev

# Копируем только нужное из builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

# Запуск приложения
CMD ["node", "dist/main.js"]