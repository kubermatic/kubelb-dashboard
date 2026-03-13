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

const port = parseInt(process.env["PORT"] ?? "3001", 10);

const config = loadKubeProxyConfig();

const oidcIssuer = process.env["OIDC_ISSUER"];
const oidcClientId = process.env["OIDC_CLIENT_ID"];
const oidcClientSecret = process.env["OIDC_CLIENT_SECRET"];
const sessionSecret = process.env["SESSION_SECRET"];

const requiredOidcVars = {
  OIDC_ISSUER: oidcIssuer,
  OIDC_CLIENT_ID: oidcClientId,
  OIDC_CLIENT_SECRET: oidcClientSecret,
  SESSION_SECRET: sessionSecret,
};
const setVars = Object.entries(requiredOidcVars).filter(([, v]) => v);
const missingVars = Object.entries(requiredOidcVars).filter(([, v]) => !v);

if (setVars.length > 0 && missingVars.length > 0) {
  console.error(
    `Partial OIDC config: ${setVars.map(([k]) => k).join(", ")} set but ${missingVars.map(([k]) => k).join(", ")} missing. Set all 4 or none.`,
  );
  process.exit(1);
}

const authEnabled = setVars.length === 4;

const redirectUri = process.env["OIDC_REDIRECT_URI"] ?? `http://localhost:${port}/auth/callback`;
const scopes = process.env["OIDC_SCOPES"] ?? "openid email profile groups offline_access";
const sessionMaxAge = parseInt(process.env["SESSION_MAX_AGE"] ?? "86400", 10);
const secureCookies = !redirectUri.startsWith("http://localhost");

const app = Fastify({ logger: true });

await app.register(cookie);
await app.register(websocket);

if (authEnabled) {
  await initOidc({
    issuerUrl: oidcIssuer!,
    clientId: oidcClientId!,
    clientSecret: oidcClientSecret!,
    redirectUri,
    scopes: scopes.split(" "),
  });

  initSession(sessionSecret!);
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

  app.log.info(`OIDC authentication enabled (issuer: ${oidcIssuer})`);
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
      if (!authEnabled) {
        const token = getAuthToken(config);
        if (token) {
          return { ...headers, authorization: `Bearer ${token}` };
        }
      }
      return headers;
    },
  },
});

app.get("/healthz", () => ({ status: "ok" }));

await app.listen({ port, host: "0.0.0.0" });
