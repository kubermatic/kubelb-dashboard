/*
 * Copyright 2026 The KubeLB Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import proxy from "@fastify/http-proxy";
import { loadKubeProxyConfig, getAuthToken, type KubeProxyConfig } from "./kube-config.js";
import { initOidc } from "./auth/oidc.js";
import { initSession } from "./auth/session.js";
import { authRoutes } from "./auth/routes.js";
import { initAuthMiddleware, authMiddleware } from "./auth/middleware.js";
import {
  env,
  authEnabled as defaultAuthEnabled,
  readOnly as defaultReadOnly,
  kubeProxyAllowlistDisabled as defaultKubeProxyAllowlistDisabled,
  watchEnabled as defaultWatchEnabled,
} from "./env.js";
import { isAllowedKubePath } from "./allowlist.js";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export interface BuildAppOptions {
  config?: KubeProxyConfig;
  authEnabled?: boolean;
  readOnly?: boolean;
  allowlistDisabled?: boolean;
  watchEnabled?: boolean;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const config = options.config ?? loadKubeProxyConfig();
  const authEnabled = options.authEnabled ?? defaultAuthEnabled;
  const readOnly = options.readOnly ?? defaultReadOnly;
  const allowlistDisabled = options.allowlistDisabled ?? defaultKubeProxyAllowlistDisabled;
  const watchEnabled = options.watchEnabled ?? defaultWatchEnabled;

  const redirectUri = env.OIDC_REDIRECT_URI ?? `http://localhost:${env.PORT}/auth/callback`;
  const scopes = env.OIDC_SCOPES;
  const sessionMaxAge = env.SESSION_MAX_AGE;
  const secureCookies = !redirectUri.startsWith("http://localhost");

  const app = Fastify({ logger: options.logger ?? true });

  await app.register(cookie);

  if (authEnabled) {
    await initOidc({
      issuerUrl: env.OIDC_ISSUER!,
      clientId: env.OIDC_CLIENT_ID!,
      clientSecret: env.OIDC_CLIENT_SECRET!,
      redirectUri,
      scopes: scopes.split(" "),
    });

    initSession(env.SESSION_SECRET!);
    initAuthMiddleware({ sessionMaxAge, secureCookies });

    await app.register(authRoutes, {
      redirectUri,
      scopes,
      sessionMaxAge,
      secureCookies,
    });

    app.addHook("onRequest", async (request, reply) => {
      if (request.url.startsWith("/api/kube")) {
        await authMiddleware(request, reply);
      }
    });

    app.log.info(`OIDC authentication enabled (issuer: ${env.OIDC_ISSUER})`);
  } else {
    app.log.warn("No OIDC configuration — running without authentication");
  }

  if (allowlistDisabled) {
    app.log.warn("KUBE_PROXY_ALLOWLIST_DISABLED=true — kube proxy path allowlist is disabled");
  } else {
    app.addHook("onRequest", async (request, reply) => {
      if (!request.url.startsWith("/api/kube")) {
        return;
      }
      const path = request.url.slice("/api/kube".length).split("?")[0];
      if (!isAllowedKubePath(path)) {
        app.log.warn(`Blocked disallowed kube proxy path: ${path}`);
        return reply.code(403).send({ error: "path not allowed" });
      }
    });
  }

  if (readOnly) {
    app.addHook("onRequest", async (request, reply) => {
      if (request.url.startsWith("/api/kube") && !READ_METHODS.has(request.method)) {
        return reply.code(403).send({ error: "Dashboard is running in read-only mode" });
      }
    });
    app.log.info("Read-only mode enabled — mutating requests to /api/kube are rejected");
  }

  await app.register(proxy, {
    upstream: config.upstream,
    prefix: "/api/kube",
    rewritePrefix: "",
    undici: {
      connect: {
        ca: config.ca?.toString(),
        cert: config.cert?.toString(),
        key: config.key?.toString(),
        rejectUnauthorized: config.rejectUnauthorized,
      },
    },
    replyOptions: {
      rewriteRequestHeaders: (_originalReq, headers) => {
        const token = getAuthToken(config);
        if (token) {
          return { ...headers, authorization: `Bearer ${token}` };
        }
        return headers;
      },
    },
  });

  app.get("/api/config", () => ({ authEnabled, readOnly, watchEnabled }));
  app.get("/healthz", () => ({ status: "ok" }));
  app.get("/readyz", () => ({ status: "ok" }));

  return app;
}
