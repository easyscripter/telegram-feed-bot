FROM node:20-alpine AS dependencies

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json yarn.lock ./

# Устанавливаем все зависимости
RUN yarn install --frozen-lockfile && \
    yarn cache clean


FROM node:20-alpine AS build

WORKDIR /app

# Копируем node_modules из предыдущего stage
COPY --from=dependencies /app/node_modules ./node_modules

# Копируем исходники
COPY . .

# Компилируем TypeScript
RUN yarn build

# Удаляем dev зависимости, оставляем только production
RUN yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline && \
    yarn cache clean


FROM node:20-alpine AS production

# Создаем пользователя без root прав
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Копируем production node_modules и собранный код
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./
COPY --from=build --chown=nestjs:nodejs /app/yarn.lock ./

# Создаем папку для session файлов Telegram
RUN mkdir -p /app/.telegram && \
    chown -R nestjs:nodejs /app/.telegram

# Переключаемся на непривилегированного пользователя
USER nestjs

# Открываем порт (если нужен REST API)
EXPOSE 3001

# Запускаем приложение
CMD ["node", "dist/main"]
