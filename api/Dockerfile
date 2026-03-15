# node:22-alpine
FROM node:22-alpine@sha256:8094c002d08262dba12645a3b4a15cd6cd627d30bc782f53229a2ec13ee22a00 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# node:22-alpine
FROM node:22-alpine@sha256:8094c002d08262dba12645a3b4a15cd6cd627d30bc782f53229a2ec13ee22a00

LABEL org.opencontainers.image.source="https://github.com/kubermatic/kubelb-dashboard"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001

USER node

CMD ["node", "dist/server.js"]
