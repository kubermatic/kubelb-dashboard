# node:26-alpine
FROM node:26-alpine@sha256:7c6af15abe4e3de859690e7db171d0d711bf37d27528eddfe625b2fe89e097f8 AS build

WORKDIR /app

RUN npm install -g --ignore-scripts pnpm@11.1.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# nginxinc/nginx-unprivileged:1-alpine
FROM nginxinc/nginx-unprivileged:1-alpine@sha256:6320020c7da8714feab524e02c08c5a1958675c4e68700e93a2fd8970b065786

LABEL org.opencontainers.image.source="https://github.com/kubermatic/kubelb-dashboard"

COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080
