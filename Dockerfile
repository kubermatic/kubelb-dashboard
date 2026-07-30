# node:26-alpine
# Runs on the build platform: only the static dist/ is carried into the runtime
# stage, so emulating the target arch here only risks QEMU faults during install.
FROM --platform=$BUILDPLATFORM node:26-alpine@sha256:7c6af15abe4e3de859690e7db171d0d711bf37d27528eddfe625b2fe89e097f8 AS build

WORKDIR /app

RUN npm install -g --ignore-scripts pnpm@11.1.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# nginxinc/nginx-unprivileged:1-alpine
FROM nginxinc/nginx-unprivileged:1-alpine@sha256:18d67281256ded39ff65e010ae4f831be18f19356f83c60bc546492c7eb6dd23

LABEL org.opencontainers.image.source="https://github.com/kubermatic/kubelb-dashboard"

COPY --chown=101:101 nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

EXPOSE 8080
