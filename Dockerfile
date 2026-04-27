# node:24-alpine
FROM node:24-alpine@sha256:8e2c930fda481a6ec141fe5a88e8c249c69f8102fe98af505f38c081649ea749 AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# nginxinc/nginx-unprivileged:1-alpine
FROM nginxinc/nginx-unprivileged:1-alpine@sha256:e1e4338d90a31f3fc6c549f1383cc3610cbcdc7e8d79991f4281f8ddc3cc1ee8

USER root
RUN apk upgrade --no-cache
USER 101

LABEL org.opencontainers.image.source="https://github.com/kubermatic/kubelb-dashboard"

COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080
