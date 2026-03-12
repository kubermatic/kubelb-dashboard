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

USER node

CMD ["node", "dist/server.js"]
