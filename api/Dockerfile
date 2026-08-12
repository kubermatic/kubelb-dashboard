# node:26-alpine
# Runs on the build platform: the emitted dist/ and the production dependency
# tree are pure JavaScript, so emulating the target arch here only risks QEMU
# faults during install.
FROM --platform=$BUILDPLATFORM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019 AS build

WORKDIR /app

RUN npm install -g --ignore-scripts pnpm@11.1.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build
RUN pnpm prune --prod --ignore-scripts

# node:26-alpine
FROM node:26-alpine@sha256:aadf416b2cdce311a8811ba3f0608a61b77dbf997500e2eafe781b51f6a0b019

LABEL org.opencontainers.image.source="https://github.com/kubermatic/kubelb-dashboard"

# Dependencies are copied from the build stage; package managers are not needed at runtime.
RUN rm -rf \
      /opt/yarn-* \
      /usr/local/lib/node_modules/corepack \
      /usr/local/lib/node_modules/npm \
    && rm -f \
      /usr/local/bin/corepack \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/pnpm \
      /usr/local/bin/pnpx \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

EXPOSE 3001

USER node

CMD ["node", "dist/server.js"]
