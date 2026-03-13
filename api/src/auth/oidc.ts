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

import * as client from "openid-client";
import { randomBytes } from "node:crypto";
import { decodeJwt } from "jose";

export interface OidcOptions {
  issuerUrl: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: string[];
}

export interface TokenResult {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  expiresAt: number;
}

let config: client.Configuration | undefined;
let opts: OidcOptions | undefined;

export async function initOidc(options: OidcOptions): Promise<void> {
  opts = options;
  const clientAuth = options.clientSecret
    ? client.ClientSecretPost(options.clientSecret)
    : client.None();
  config = await client.discovery(
    new URL(options.issuerUrl),
    options.clientId,
    undefined,
    clientAuth,
  );
}

function getConfig(): client.Configuration {
  if (!config || !opts) {
    throw new Error("OIDC not initialized — call initOidc() first");
  }
  return config;
}

function getOpts(): OidcOptions {
  if (!opts) {
    throw new Error("OIDC not initialized — call initOidc() first");
  }
  return opts;
}

export function generateState(): string {
  return randomBytes(32).toString("hex");
}

export function generateCodeVerifier(): string {
  return client.randomPKCECodeVerifier();
}

export async function computeCodeChallenge(verifier: string): Promise<string> {
  return client.calculatePKCECodeChallenge(verifier);
}

export function buildAuthorizeUrl(params: {
  state: string;
  codeChallenge: string;
  redirectUri?: string;
  scopes?: string[];
}): URL {
  const cfg = getConfig();
  const o = getOpts();
  const scopes = params.scopes ?? o.scopes ?? ["openid", "profile", "email"];

  return client.buildAuthorizationUrl(cfg, {
    redirect_uri: params.redirectUri ?? o.redirectUri,
    scope: scopes.join(" "),
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
    state: params.state,
  });
}

function toTokenResult(
  tokens: Awaited<ReturnType<typeof client.authorizationCodeGrant>>,
): TokenResult {
  const expiresAt = tokens.expires_in
    ? Math.floor(Date.now() / 1000) + tokens.expires_in
    : Math.floor(Date.now() / 1000) + 3600;

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    idToken: tokens.id_token ?? "",
    expiresAt,
  };
}

export async function exchangeCode(
  callbackUrl: URL,
  codeVerifier: string,
  expectedState: string,
): Promise<TokenResult> {
  const cfg = getConfig();
  const tokens = await client.authorizationCodeGrant(cfg, callbackUrl, {
    pkceCodeVerifier: codeVerifier,
    expectedState,
  });
  return toTokenResult(tokens);
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResult> {
  const cfg = getConfig();
  const tokens = await client.refreshTokenGrant(cfg, refreshToken);
  return toTokenResult(tokens);
}

export function getEndSessionUrl(postLogoutRedirectUri?: string): string | undefined {
  const cfg = getConfig();
  const endpoint = cfg.serverMetadata().end_session_endpoint;
  if (!endpoint) return undefined;

  const url = new URL(endpoint);
  url.searchParams.set("client_id", getOpts().clientId);
  if (postLogoutRedirectUri) {
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
  }
  return url.toString();
}

export function decodeIdTokenClaims(idToken: string): Record<string, unknown> {
  return decodeJwt(idToken) as Record<string, unknown>;
}
