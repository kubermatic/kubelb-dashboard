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

import { beforeAll, describe, expect, it } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import {
  initSession,
  encryptSession,
  decryptSession,
  setSessionCookies,
  readSessionCookies,
  type SessionPayload,
} from "./session.js";

const TEST_SECRET = "test-session-secret-0123456789abcdef";

const basePayload: SessionPayload = {
  sub: "user-123",
  email: "user@example.com",
  name: "Test User",
  groups: ["admins", "developers"],
  accessToken: "access-token-value",
  refreshToken: "refresh-token-value",
  accessTokenExp: 1893456000,
};

function fakeReply() {
  const cookies: Record<string, string> = {};
  const reply = {
    setCookie(name: string, value: string) {
      cookies[name] = value;
      return reply;
    },
  };
  return { reply: reply as unknown as FastifyReply, cookies };
}

function fakeRequest(cookies: Record<string, string>): FastifyRequest {
  return { cookies } as unknown as FastifyRequest;
}

beforeAll(() => {
  initSession(TEST_SECRET);
});

describe("encryptSession / decryptSession", () => {
  it("round-trips a full session payload", async () => {
    const token = await encryptSession(basePayload, 3600);
    const decrypted = await decryptSession(token);
    expect(decrypted).toMatchObject(basePayload);
  });

  it("returns null for a garbage token", async () => {
    expect(await decryptSession("not-a-jwe-token")).toBeNull();
  });

  it("returns null for a tampered token", async () => {
    const token = await encryptSession(basePayload, 3600);
    const mid = Math.floor(token.length / 2);
    const flipped = token[mid] === "A" ? "B" : "A";
    const tampered = token.slice(0, mid) + flipped + token.slice(mid + 1);
    expect(await decryptSession(tampered)).toBeNull();
  });

  it("returns null once the encryption maxAge has elapsed", async () => {
    const token = await encryptSession(basePayload, -1);
    expect(await decryptSession(token)).toBeNull();
  });
});

describe("setSessionCookies / readSessionCookies", () => {
  it("round-trips a small token as a single chunk", () => {
    const token = "short-token-value";
    const { reply, cookies } = fakeReply();
    setSessionCookies(reply, token, 3600, false);

    expect(cookies["session.count"]).toBe("1");
    expect(cookies["session.0"]).toBe(token);
    expect(readSessionCookies(fakeRequest(cookies))).toBe(token);
  });

  it("chunks a large encrypted payload and reassembles it exactly", async () => {
    const largePayload: SessionPayload = {
      ...basePayload,
      groups: Array.from({ length: 50 }, (_, i) => `group-${i}-${"x".repeat(80)}`),
    };
    const token = await encryptSession(largePayload, 3600);
    expect(token.length).toBeGreaterThan(3800);

    const { reply, cookies } = fakeReply();
    setSessionCookies(reply, token, 3600, false);

    const count = parseInt(cookies["session.count"], 10);
    expect(count).toBeGreaterThanOrEqual(2);

    const reassembled = readSessionCookies(fakeRequest(cookies));
    expect(reassembled).toBe(token);
    expect(await decryptSession(reassembled!)).toMatchObject(largePayload);
  });

  it("returns null when the count cookie is missing", () => {
    expect(readSessionCookies(fakeRequest({ "session.0": "abc" }))).toBeNull();
  });

  it("returns null when a chunk is missing", () => {
    expect(
      readSessionCookies(fakeRequest({ "session.count": "2", "session.0": "abc" })),
    ).toBeNull();
  });

  it("rejects a chunk count above 10", () => {
    const cookies: Record<string, string> = { "session.count": "11" };
    for (let i = 0; i < 11; i++) cookies[`session.${i}`] = "x";
    expect(readSessionCookies(fakeRequest(cookies))).toBeNull();
  });
});
