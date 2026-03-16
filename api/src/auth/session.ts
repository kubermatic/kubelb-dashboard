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

import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash } from "node:crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import "@fastify/cookie";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  groups: string[];
  accessToken: string;
  refreshToken?: string;
  accessTokenExp: number;
}

const CHUNK_SIZE = 3800;
const COOKIE_PREFIX = "session";

let encryptionKey: Uint8Array | undefined;

export function initSession(secret: string): void {
  if (secret.length < 32) {
    throw new Error("Session secret must be at least 32 characters");
  }
  encryptionKey = createHash("sha256").update(secret).digest();
}

function getKey(): Uint8Array {
  if (!encryptionKey) {
    throw new Error("Session not initialized — call initSession() first");
  }
  return encryptionKey;
}

export async function encryptSession(payload: SessionPayload, maxAge: number): Promise<string> {
  return new EncryptJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .encrypt(getKey());
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtDecrypt(token, getKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

interface CookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge?: number;
}

function cookieOpts(secure: boolean, maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure,
    ...(maxAge !== undefined && { maxAge }),
  };
}

export function setSessionCookies(
  reply: FastifyReply,
  token: string,
  maxAge: number,
  secure: boolean,
): void {
  const chunks: string[] = [];
  for (let i = 0; i < token.length; i += CHUNK_SIZE) {
    chunks.push(token.slice(i, i + CHUNK_SIZE));
  }

  const opts = cookieOpts(secure, maxAge);
  for (let i = 0; i < chunks.length; i++) {
    reply.setCookie(`${COOKIE_PREFIX}.${i}`, chunks[i], opts);
  }
  reply.setCookie(`${COOKIE_PREFIX}.count`, String(chunks.length), opts);
}

export function readSessionCookies(request: FastifyRequest): string | null {
  const cookies = request.cookies;
  const countStr = cookies[`${COOKIE_PREFIX}.count`];
  if (!countStr) return null;

  const count = parseInt(countStr, 10);
  if (isNaN(count) || count <= 0 || count > 10) return null;

  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = cookies[`${COOKIE_PREFIX}.${i}`];
    if (!chunk) return null;
    parts.push(chunk);
  }
  return parts.join("");
}

export function clearSessionCookies(
  reply: FastifyReply,
  request: FastifyRequest,
  secure: boolean,
): void {
  const cookies = request.cookies;
  const countStr = cookies[`${COOKIE_PREFIX}.count`];
  const count = countStr ? parseInt(countStr, 10) : 0;

  const opts = cookieOpts(secure, 0);
  for (let i = 0; i < count; i++) {
    reply.clearCookie(`${COOKIE_PREFIX}.${i}`, opts);
  }
  reply.clearCookie(`${COOKIE_PREFIX}.count`, opts);
}

export async function getSession(request: FastifyRequest): Promise<SessionPayload | null> {
  const token = readSessionCookies(request);
  if (!token) return null;
  return decryptSession(token);
}
