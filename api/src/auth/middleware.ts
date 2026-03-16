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

import type { FastifyReply, FastifyRequest } from "fastify";
import { getSession, encryptSession, setSessionCookies, type SessionPayload } from "./session.js";
import { refreshAccessToken } from "./oidc.js";
import { TOKEN_REFRESH_WINDOW_SECONDS } from "./constants.js";

let middlewareConfig: { sessionMaxAge: number; secureCookies: boolean };

export function initAuthMiddleware(config: {
  sessionMaxAge: number;
  secureCookies: boolean;
}): void {
  middlewareConfig = config;
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const session = await getSession(request);
  if (!session) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = session.accessTokenExp - now;

  if (expiresIn < TOKEN_REFRESH_WINDOW_SECONDS && session.refreshToken) {
    try {
      const tokens = await refreshAccessToken(session.refreshToken);
      const updated: SessionPayload = {
        ...session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? session.refreshToken,
        accessTokenExp: tokens.expiresAt,
      };
      const encrypted = await encryptSession(updated, middlewareConfig.sessionMaxAge);
      setSessionCookies(
        reply,
        encrypted,
        middlewareConfig.sessionMaxAge,
        middlewareConfig.secureCookies,
      );
      request.headers.authorization = `Bearer ${tokens.accessToken}`;
    } catch {
      reply.code(401).send({ error: "unauthorized" });
      return;
    }
  } else {
    request.headers.authorization = `Bearer ${session.accessToken}`;
  }
}
