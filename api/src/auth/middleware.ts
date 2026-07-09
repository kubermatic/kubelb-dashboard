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
import { getSession, encryptSession, setSessionCookies } from "./session.js";
import { refreshSessionIfNeeded } from "./refresh.js";

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

  const refreshed = await refreshSessionIfNeeded(session);
  if (!refreshed) {
    reply.code(401).send({ error: "unauthorized" });
    return;
  }
  if (refreshed !== session) {
    const encrypted = await encryptSession(refreshed, middlewareConfig.sessionMaxAge);
    setSessionCookies(
      reply,
      encrypted,
      middlewareConfig.sessionMaxAge,
      middlewareConfig.secureCookies,
    );
  }
}
