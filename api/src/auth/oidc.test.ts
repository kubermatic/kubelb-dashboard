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

import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  initOidc,
  generateState,
  generateCodeVerifier,
  computeCodeChallenge,
  buildAuthorizeUrl,
  decodeIdTokenClaims,
} from "./oidc.js";

vi.mock("openid-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("openid-client")>();
  return {
    ...actual,
    discovery: vi.fn(
      async (_issuer: URL, clientId: string, _metadata: unknown, clientAuth: unknown) =>
        new actual.Configuration(
          {
            issuer: "https://idp.example.com",
            authorization_endpoint: "https://idp.example.com/auth",
            token_endpoint: "https://idp.example.com/token",
          },
          clientId,
          {},
          clientAuth as Parameters<typeof actual.discovery>[3],
        ),
    ),
  };
});

function base64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

describe("generateState", () => {
  it("returns 64 hex characters, distinct per call", () => {
    const a = generateState();
    const b = generateState();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("generateCodeVerifier", () => {
  it("returns a 43-character base64url string, distinct per call", () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(b).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
  });
});

describe("computeCodeChallenge", () => {
  it("produces the RFC 7636 S256 challenge for the RFC appendix B verifier", async () => {
    const challenge = await computeCodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk");
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});

describe("decodeIdTokenClaims", () => {
  it("decodes the payload of an unsigned JWT", () => {
    const claims = {
      sub: "user-123",
      email: "user@example.com",
      name: "Test User",
      groups: ["admins"],
    };
    const jwt = `${base64url({ alg: "none" })}.${base64url(claims)}.`;
    expect(decodeIdTokenClaims(jwt)).toEqual(claims);
  });
});

describe("buildAuthorizeUrl", () => {
  beforeAll(async () => {
    await initOidc({
      issuerUrl: "https://idp.example.com",
      clientId: "kubelb-dashboard",
      clientSecret: "test-client-secret",
      redirectUri: "http://localhost:3001/auth/callback",
    });
  });

  it("includes client_id, redirect_uri, scope, state, and PKCE params", () => {
    const url = buildAuthorizeUrl({
      state: "test-state",
      codeChallenge: "test-challenge",
    });

    expect(url.origin).toBe("https://idp.example.com");
    expect(url.searchParams.get("client_id")).toBe("kubelb-dashboard");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3001/auth/callback");
    expect(url.searchParams.get("scope")).toBe("openid profile email");
    expect(url.searchParams.get("state")).toBe("test-state");
    expect(url.searchParams.get("code_challenge")).toBe("test-challenge");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("honors explicit scopes and redirectUri overrides", () => {
    const url = buildAuthorizeUrl({
      state: "test-state",
      codeChallenge: "test-challenge",
      redirectUri: "http://localhost:9999/other/callback",
      scopes: ["openid", "groups"],
    });

    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:9999/other/callback");
    expect(url.searchParams.get("scope")).toBe("openid groups");
  });
});
