# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN npm run build

# Produção carrega o node_modules inteiro (inclusive devDependencies) de
# propósito: `prisma migrate deploy` no CMD precisa da CLI do Prisma, que
# é devDependency (só o @prisma/client, usado em runtime, é dependency
# normal). Trocar por um node_modules podado é uma otimização de imagem
# válida depois, não um requisito de correção agora.
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
