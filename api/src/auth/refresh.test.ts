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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSessionIfNeeded } from "./refresh.js";
import { refreshAccessToken } from "./oidc.js";
import type { SessionPayload } from "./session.js";

vi.mock("./oidc.js", () => ({
  refreshAccessToken: vi.fn(),
}));

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

beforeEach(() => {
  vi.mocked(refreshAccessToken).mockReset();
});

describe("refreshSessionIfNeeded", () => {
  it("returns the input session unchanged when outside the refresh window", async () => {
    const session = sessionPayload();
    const result = await refreshSessionIfNeeded(session);

    expect(result).toBe(session);
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("returns the input session unchanged when there is no refresh token", async () => {
    const session = sessionPayload({
      accessTokenExp: Math.floor(Date.now() / 1000) + 10,
      refreshToken: undefined,
    });
    const result = await refreshSessionIfNeeded(session);

    expect(result).toBe(session);
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it("refreshes the session when inside the refresh window", async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = sessionPayload({ accessTokenExp: now + 10 });
    vi.mocked(refreshAccessToken).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      idToken: "",
      expiresAt: now + 3600,
    });

    const result = await refreshSessionIfNeeded(session);

    expect(refreshAccessToken).toHaveBeenCalledExactlyOnceWith("old-refresh-token");
    expect(result).toMatchObject({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      accessTokenExp: now + 3600,
    });
  });

  it("single-flights concurrent refreshes for the same refresh token", async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = sessionPayload({ accessTokenExp: now + 10 });
    vi.mocked(refreshAccessToken).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                idToken: "",
                expiresAt: now + 3600,
              }),
            50,
          );
        }),
    );

    const results = await Promise.all([
      refreshSessionIfNeeded(session),
      refreshSessionIfNeeded(session),
      refreshSessionIfNeeded(session),
      refreshSessionIfNeeded(session),
      refreshSessionIfNeeded(session),
    ]);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    for (const result of results) {
      expect(result).toBe(results[0]);
      expect(result).toMatchObject({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        accessTokenExp: now + 3600,
      });
    }
  });

  it("resolves all concurrent callers with null on refresh failure, then retries on a subsequent call", async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = sessionPayload({ accessTokenExp: now + 10 });
    vi.mocked(refreshAccessToken).mockRejectedValueOnce(new Error("refresh failed"));

    const results = await Promise.all([
      refreshSessionIfNeeded(session),
      refreshSessionIfNeeded(session),
      refreshSessionIfNeeded(session),
    ]);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    for (const result of results) {
      expect(result).toBeNull();
    }

    vi.mocked(refreshAccessToken).mockResolvedValue({
      accessToken: "second-access-token",
      refreshToken: "second-refresh-token",
      idToken: "",
      expiresAt: now + 3600,
    });

    const retry = await refreshSessionIfNeeded(session);

    expect(refreshAccessToken).toHaveBeenCalledTimes(2);
    expect(retry).toMatchObject({
      accessToken: "second-access-token",
      refreshToken: "second-refresh-token",
    });
  });

  it("keeps the input refresh token when the refresh result omits one", async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = sessionPayload({
      accessTokenExp: now + 10,
      refreshToken: "kept-refresh-token",
    });
    vi.mocked(refreshAccessToken).mockResolvedValue({
      accessToken: "new-access-token",
      idToken: "",
      expiresAt: now + 3600,
    });

    const result = await refreshSessionIfNeeded(session);

    expect(result).toMatchObject({
      accessToken: "new-access-token",
      refreshToken: "kept-refresh-token",
    });
  });

  it("carries the rotated refresh token when the refresh result includes one", async () => {
    const now = Math.floor(Date.now() / 1000);
    const session = sessionPayload({ accessTokenExp: now + 10, refreshToken: "old-refresh-token" });
    vi.mocked(refreshAccessToken).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "rotated-refresh-token",
      idToken: "",
      expiresAt: now + 3600,
    });

    const result = await refreshSessionIfNeeded(session);

    expect(result).toMatchObject({
      refreshToken: "rotated-refresh-token",
    });
  });
});
