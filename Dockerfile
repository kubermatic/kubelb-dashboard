# node:24-alpine
FROM node:25-alpine@sha256:5209bcaca9836eb3448b650396213dbe9d9a34d31840c2ae1f206cb2986a8543 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# nginxinc/nginx-unprivileged:1-alpine
FROM nginxinc/nginx-unprivileged:1-alpine@sha256:aec540f08f99df3c830549d5dd7bfaf63e01cbbb499e37400c5af9f8e8554e9f

USER root
RUN apk upgrade --no-cache
USER 101

LABEL org.opencontainers.image.source="https://github.com/kubermatic/kubelb-dashboard"

COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080
