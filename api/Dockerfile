FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

FROM node:22-alpine

LABEL org.opencontainers.image.source="https://github.com/kubermatic/kubelb-dashboard"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://localhost:3001/healthz').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]

USER node

CMD ["node", "dist/server.js"]
