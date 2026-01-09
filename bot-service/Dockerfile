FROM node:20-alpine AS dependencies

WORKDIR /app

COPY package.json yarn.lock ./

# Устанавливаем только production зависимости
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

# Удаляем dev-зависимости после сборки
RUN yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline && \
    yarn cache clean


FROM node:20-alpine AS production

RUN corepack enable

# Создаем пользователя без root прав
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Копируем только необходимое
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/package.json ./
COPY --from=build --chown=nestjs:nodejs /app/yarn.lock ./

# Переключаемся на непривилегированного пользователя
USER nestjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["node", "dist/main"]
