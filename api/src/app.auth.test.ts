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

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { FastifyInstance } from "fastify";
import type { SessionPayload } from "./auth/session.js";

vi.mock("./auth/oidc.js", () => ({
  initOidc: vi.fn(async () => {}),
  generateState: vi.fn(),
  generateCodeVerifier: vi.fn(),
  computeCodeChallenge: vi.fn(),
  buildAuthorizeUrl: vi.fn(),
  exchangeCode: vi.fn(),
  refreshAccessToken: vi.fn(),
  getEndSessionUrl: vi.fn(),
  decodeIdTokenClaims: vi.fn(),
}));

process.env.OIDC_ISSUER = "https://idp.example.com";
process.env.OIDC_CLIENT_ID = "kubelb-dashboard";
process.env.OIDC_CLIENT_SECRET = "test-client-secret";
process.env.SESSION_SECRET = "test-session-secret-0123456789abcdef";
process.env.OIDC_REDIRECT_URI = "http://localhost:3001/auth/callback";

const SESSION_MAX_AGE = 86400;
const CHUNK_SIZE = 3800;

let upstream: Server;
let upstreamHits = 0;
let app: FastifyInstance;
let encryptSession: (payload: SessionPayload, maxAge: number) => Promise<string>;

function sessionCookies(token: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const chunks = token.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) ?? [];
  chunks.forEach((chunk, i) => {
    cookies[`session.${i}`] = chunk;
  });
  cookies["session.count"] = String(chunks.length);
  return cookies;
}

async function validSessionCookies(): Promise<Record<string, string>> {
  const now = Math.floor(Date.now() / 1000);
  const token = await encryptSession(
    {
      sub: "user-123",
      email: "user@example.com",
      name: "Test User",
      groups: ["admins"],
      accessToken: "access-token-value",
      refreshToken: "refresh-token-value",
      accessTokenExp: now + 3600,
    },
    SESSION_MAX_AGE,
  );
  return sessionCookies(token);
}

beforeAll(async () => {
  upstream = createServer((_req, res) => {
    upstreamHits++;
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  const { port } = upstream.address() as AddressInfo;

  const { buildApp } = await import("./app.js");
  const session = await import("./auth/session.js");
  encryptSession = session.encryptSession;

  app = await buildApp({
    config: { upstream: `http://127.0.0.1:${port}`, rejectUnauthorized: false },
    authEnabled: true,
    readOnly: false,
    logger: false,
  });
});

afterAll(async () => {
  await app.close();
  await new Promise<void>((resolve) => upstream.close(() => resolve()));
});

beforeEach(() => {
  upstreamHits = 0;
});

describe("auth gate on /api/kube", () => {
  it("rejects requests without cookies with 401 and does not hit the upstream", async () => {
    const res = await app.inject({ method: "GET", url: "/api/kube/api/v1/namespaces" });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: "unauthorized" });
    expect(upstreamHits).toBe(0);
  });

  it("proxies requests with a valid session cookie to the upstream", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/kube/api/v1/namespaces",
      cookies: await validSessionCookies(),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
    expect(upstreamHits).toBe(1);
  });

  it("leaves /healthz reachable without cookies", async () => {
    const res = await app.inject({ method: "GET", url: "/healthz" });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});
