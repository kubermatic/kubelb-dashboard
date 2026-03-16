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

import Fastify from "fastify";
import cookie from "@fastify/cookie";
import proxy from "@fastify/http-proxy";
import websocket from "@fastify/websocket";
import { loadKubeProxyConfig, getAuthToken } from "./kube-config.js";
import { initOidc } from "./auth/oidc.js";
import { initSession } from "./auth/session.js";
import { authRoutes } from "./auth/routes.js";
import { initAuthMiddleware, authMiddleware } from "./auth/middleware.js";
import { env, authEnabled } from "./env.js";

const port = env.PORT;
const config = loadKubeProxyConfig();

const redirectUri = env.OIDC_REDIRECT_URI ?? `http://localhost:${port}/auth/callback`;
const scopes = env.OIDC_SCOPES;
const sessionMaxAge = env.SESSION_MAX_AGE;
const secureCookies = !redirectUri.startsWith("http://localhost");

const app = Fastify({ logger: true });

await app.register(cookie);
await app.register(websocket);

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

await app.register(proxy, {
  upstream: config.upstream,
  prefix: "/api/kube",
  rewritePrefix: "",
  websocket: true,
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

app.get("/api/config", () => ({ authEnabled }));
app.get("/healthz", () => ({ status: "ok" }));
app.get("/readyz", () => ({ status: "ok" }));

await app.listen({ port, host: "0.0.0.0" });
