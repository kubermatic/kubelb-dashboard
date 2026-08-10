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

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

vi.mock("./auth/oidc.js", () => ({
  initOidc: vi.fn(async () => {}),
  generateState: vi.fn(() => "state-value"),
  generateCodeVerifier: vi.fn(() => "code-verifier-value"),
  computeCodeChallenge: vi.fn(async () => "code-challenge-value"),
  buildAuthorizeUrl: vi.fn(() => new URL("https://idp.example.com/authorize")),
  exchangeCode: vi.fn(),
  refreshAccessToken: vi.fn(),
  getEndSessionUrl: vi.fn(() => null),
  decodeIdTokenClaims: vi.fn(),
}));

process.env.OIDC_ISSUER = "https://idp.example.com";
process.env.OIDC_CLIENT_ID = "kubelb-dashboard";
process.env.OIDC_CLIENT_SECRET = "test-client-secret";
process.env.SESSION_SECRET = "test-session-secret-0123456789abcdef";
process.env.OIDC_REDIRECT_URI = "http://localhost:3001/auth/callback";

const FLOW_LIMIT = 30;

let app: FastifyInstance;

async function hit(url: string, times: number): Promise<number[]> {
  const codes: number[] = [];
  for (let i = 0; i < times; i++) {
    const res = await app.inject({ method: "GET", url });
    codes.push(res.statusCode);
  }
  return codes;
}

beforeAll(async () => {
  const { buildApp } = await import("./app.js");
  app = await buildApp({
    config: { upstream: "http://127.0.0.1:1", rejectUnauthorized: false },
    authEnabled: true,
    readOnly: false,
    logger: false,
  });
});

afterAll(async () => {
  await app.close();
});

describe("auth endpoint rate limiting", () => {
  it("throttles /auth/login once the per-route ceiling is exceeded", async () => {
    const codes = await hit("/auth/login", FLOW_LIMIT + 1);

    expect(codes.slice(0, FLOW_LIMIT).every((c) => c === 302)).toBe(true);
    expect(codes[FLOW_LIMIT]).toBe(429);
  });

  it("gives /auth/session its own, looser bucket", async () => {
    // /auth/login is already exhausted for this client IP; /auth/session must
    // still serve well past the flow limit or the buckets are not per-route.
    const codes = await hit("/auth/session", FLOW_LIMIT + 1);

    expect(codes.every((c) => c === 200)).toBe(true);
  });
});
