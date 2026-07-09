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

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import { initAuthMiddleware, authMiddleware } from "./middleware.js";
import { initSession, encryptSession, decryptSession, type SessionPayload } from "./session.js";
import { refreshAccessToken } from "./oidc.js";

vi.mock("./oidc.js", () => ({
  refreshAccessToken: vi.fn(),
}));

const TEST_SECRET = "test-session-secret-0123456789abcdef";
const SESSION_MAX_AGE = 86400;
const CHUNK_SIZE = 3800;

function sessionPayload(overrides: Partial<SessionPayload> = {}): SessionPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: "user-123",
    email: "user@example.com",
    name: "Test User",
    groups: ["admins"],
    accessToken: "old-access-token",
    refreshToken: "old-refresh-token",
    accessTokenExp: now + 3600,
    ...overrides,
  };
}

function cookiesFor(token: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  const chunks = token.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "g")) ?? [];
  chunks.forEach((chunk, i) => {
    cookies[`session.${i}`] = chunk;
  });
  cookies["session.count"] = String(chunks.length);
  return cookies;
}

function fakeRequest(cookies: Record<string, string>): FastifyRequest {
  return { cookies } as unknown as FastifyRequest;
}

function fakeReply() {
  const state = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    cookies: {} as Record<string, string>,
  };
  const reply = {
    code(statusCode: number) {
      state.statusCode = statusCode;
      return reply;
    },
    send(body: unknown) {
      state.body = body;
      return reply;
    },
    setCookie(name: string, value: string) {
      state.cookies[name] = value;
      return reply;
    },
  };
  return { reply: reply as unknown as FastifyReply, state };
}

async function requestWithSession(payload: SessionPayload): Promise<FastifyRequest> {
  const token = await encryptSession(payload, SESSION_MAX_AGE);
  return fakeRequest(cookiesFor(token));
}

beforeAll(() => {
  initSession(TEST_SECRET);
  initAuthMiddleware({ sessionMaxAge: SESSION_MAX_AGE, secureCookies: false });
});

beforeEach(() => {
  vi.mocked(refreshAccessToken).mockReset();
});

describe("authMiddleware", () => {
  it("returns 401 when no session cookie is present", async () => {
    const { reply, state } = fakeReply();
    await authMiddleware(fakeRequest({}), reply);

    expect(state.statusCode).toBe(401);
    expect(state.body).toEqual({ error: "unauthorized" });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("returns 401 when the session cookie is invalid", async () => {
    const { reply, state } = fakeReply();
    await authMiddleware(fakeRequest(cookiesFor("garbage-token")), reply);

    expect(state.statusCode).toBe(401);
    expect(state.body).toEqual({ error: "unauthorized" });
  });

  it("passes through without refresh when the token expiry is far in the future", async () => {
    const request = await requestWithSession(sessionPayload());
    const { reply, state } = fakeReply();
    await authMiddleware(request, reply);

    expect(state.statusCode).toBeUndefined();
    expect(state.cookies).toEqual({});
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("refreshes the token and re-sets cookies inside the refresh window", async () => {
    const now = Math.floor(Date.now() / 1000);
    const request = await requestWithSession(sessionPayload({ accessTokenExp: now + 10 }));
    vi.mocked(refreshAccessToken).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      idToken: "",
      expiresAt: now + 3600,
    });

    const { reply, state } = fakeReply();
    await authMiddleware(request, reply);

    expect(state.statusCode).toBeUndefined();
    expect(refreshAccessToken).toHaveBeenCalledExactlyOnceWith("old-refresh-token");

    const count = parseInt(state.cookies["session.count"], 10);
    expect(count).toBeGreaterThanOrEqual(1);
    const reassembled = Array.from({ length: count }, (_, i) => state.cookies[`session.${i}`]).join(
      "",
    );
    expect(await decryptSession(reassembled)).toMatchObject({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      accessTokenExp: now + 3600,
    });
  });

  it("returns 401 when the refresh fails", async () => {
    const now = Math.floor(Date.now() / 1000);
    const request = await requestWithSession(sessionPayload({ accessTokenExp: now + 10 }));
    vi.mocked(refreshAccessToken).mockRejectedValue(new Error("refresh failed"));

    const { reply, state } = fakeReply();
    await authMiddleware(request, reply);

    expect(state.statusCode).toBe(401);
    expect(state.body).toEqual({ error: "unauthorized" });
  });

  it("passes through without refresh when inside the window but no refresh token exists", async () => {
    const now = Math.floor(Date.now() / 1000);
    const request = await requestWithSession(
      sessionPayload({ accessTokenExp: now + 10, refreshToken: undefined }),
    );

    const { reply, state } = fakeReply();
    await authMiddleware(request, reply);

    expect(state.statusCode).toBeUndefined();
    expect(state.cookies).toEqual({});
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});
