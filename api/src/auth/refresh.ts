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

import { refreshAccessToken } from "./oidc.js";
import type { SessionPayload } from "./session.js";
import { TOKEN_REFRESH_WINDOW_SECONDS } from "./constants.js";

const inFlightRefreshes = new Map<string, Promise<SessionPayload | null>>();

export async function refreshSessionIfNeeded(
  session: SessionPayload,
): Promise<SessionPayload | null> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = session.accessTokenExp - now;

  if (expiresIn >= TOKEN_REFRESH_WINDOW_SECONDS || !session.refreshToken) {
    return session;
  }

  const refreshToken = session.refreshToken;
  const existing = inFlightRefreshes.get(refreshToken);
  if (existing) {
    return existing;
  }

  const pending = (async () => {
    try {
      const tokens = await refreshAccessToken(refreshToken);
      const updated: SessionPayload = {
        ...session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? session.refreshToken,
        accessTokenExp: tokens.expiresAt,
      };
      return updated;
    } catch {
      return null;
    } finally {
      inFlightRefreshes.delete(refreshToken);
    }
  })();

  inFlightRefreshes.set(refreshToken, pending);
  return pending;
}
