# 1. Fáze: Instalace a Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Tady se vytváří "hotová" verze aplikace
RUN npm run build

# 2. Fáze: Spuštění (Production)
FROM node:18-alpine AS runner
WORKDIR /app

# Nastavení prostředí na "Produkce" (rychlejší, bezpečnější)
ENV NODE_ENV production

# Zkopírujeme jen to, co je potřeba z první fáze
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Otevřeme port 3000
EXPOSE 3000

# Příkaz, který server spustí
CMD ["npm", "start"]