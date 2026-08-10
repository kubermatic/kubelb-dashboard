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

import type { FastifyInstance } from "fastify";
import "@fastify/cookie";
import {
  generateState,
  generateCodeVerifier,
  computeCodeChallenge,
  buildAuthorizeUrl,
  exchangeCode,
  getEndSessionUrl,
  decodeIdTokenClaims,
} from "./oidc.js";
import {
  encryptSession,
  setSessionCookies,
  getSession,
  clearSessionCookies,
  type SessionPayload,
} from "./session.js";
import { refreshSessionIfNeeded } from "./refresh.js";

interface AuthRouteOptions {
  redirectUri: string;
  scopes: string;
  sessionMaxAge: number;
  secureCookies: boolean;
}

const TEMP_COOKIE_MAX_AGE = 300;

// The global limiter is sized for the dashboard's API polling and is far too
// loose for the OIDC endpoints, which reach out to the identity provider.
// `/auth/callback` is the sharpest edge: it is unauthenticated and every
// request carrying a self-set `state` cookie drives an outbound token
// exchange, so an attacker could use it to amplify traffic at the IdP.
// Limits are per client IP, so they are sized to absorb an office behind a
// single NAT egress address rather than a single user.
const FLOW_RATE_LIMIT = { max: 30, timeWindow: "1 minute" } as const;

// Cheap for unauthenticated callers (no session cookie short-circuits to
// `{authenticated:false}`) but the browser polls it, so it gets more headroom.
const SESSION_RATE_LIMIT = { max: 120, timeWindow: "1 minute" } as const;

function isRelativePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

function tempCookieOpts(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: TEMP_COOKIE_MAX_AGE,
  };
}

export async function authRoutes(app: FastifyInstance, opts: AuthRouteOptions): Promise<void> {
  app.get<{ Querystring: { return_to?: string } }>(
    "/auth/login",
    { config: { rateLimit: FLOW_RATE_LIMIT } },
    async (request, reply) => {
      const state = generateState();
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await computeCodeChallenge(codeVerifier);

      const cookieOpts = tempCookieOpts(opts.secureCookies);
      reply.setCookie("oauth_state", state, cookieOpts);
      reply.setCookie("code_verifier", codeVerifier, cookieOpts);

      const returnTo = request.query.return_to;
      if (returnTo && isRelativePath(returnTo)) {
        reply.setCookie("return_to", returnTo, cookieOpts);
      }

      const authorizeUrl = buildAuthorizeUrl({
        state,
        codeChallenge,
        scopes: opts.scopes.split(" "),
      });

      return reply.redirect(authorizeUrl.toString());
    },
  );

  app.get<{ Querystring: { state?: string } }>(
    "/auth/callback",
    { config: { rateLimit: FLOW_RATE_LIMIT } },
    async (request, reply) => {
      const expectedState = request.cookies["oauth_state"];
      const queryState = request.query.state;

      if (!expectedState || !queryState || queryState !== expectedState) {
        return reply.code(403).send({ error: "state mismatch" });
      }

      const codeVerifier = request.cookies["code_verifier"];
      if (!codeVerifier) {
        return reply.code(403).send({ error: "missing code_verifier" });
      }

      const callbackUrl = new URL(request.url, opts.redirectUri);

      const tokens = await exchangeCode(callbackUrl, codeVerifier, expectedState);
      const claims = decodeIdTokenClaims(tokens.idToken);

      const session: SessionPayload = {
        sub: String(claims["sub"] ?? ""),
        email: String(claims["email"] ?? ""),
        name: String(claims["name"] ?? claims["preferred_username"] ?? ""),
        groups: Array.isArray(claims["groups"]) ? (claims["groups"] as string[]) : [],
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExp: tokens.expiresAt,
      };

      const encrypted = await encryptSession(session, opts.sessionMaxAge);
      setSessionCookies(reply, encrypted, opts.sessionMaxAge, opts.secureCookies);

      const clearOpts = tempCookieOpts(opts.secureCookies);
      clearOpts.maxAge = 0;
      reply.clearCookie("oauth_state", clearOpts);
      reply.clearCookie("code_verifier", clearOpts);

      const returnTo = request.cookies["return_to"];
      reply.clearCookie("return_to", clearOpts);

      const redirectTo = returnTo && isRelativePath(returnTo) ? returnTo : "/";

      return reply.redirect(redirectTo);
    },
  );

  app.post("/auth/logout", { config: { rateLimit: FLOW_RATE_LIMIT } }, async (request, reply) => {
    clearSessionCookies(reply, request, opts.secureCookies);

    const origin = `${request.protocol}://${request.host}`;
    const logoutUrl = getEndSessionUrl(origin) ?? null;

    return { logoutUrl };
  });

  app.get(
    "/auth/session",
    { config: { rateLimit: SESSION_RATE_LIMIT } },
    async (request, reply) => {
      const session = await getSession(request);
      if (!session) {
        return { authenticated: false };
      }

      const refreshed = await refreshSessionIfNeeded(session);
      if (!refreshed) {
        return { authenticated: false };
      }

      if (refreshed !== session) {
        const encrypted = await encryptSession(refreshed, opts.sessionMaxAge);
        setSessionCookies(reply, encrypted, opts.sessionMaxAge, opts.secureCookies);
      }

      return {
        authenticated: true,
        user: {
          email: refreshed.email,
          name: refreshed.name,
          groups: refreshed.groups,
        },
      };
    },
  );
}
