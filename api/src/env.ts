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

import { z } from "zod";

const oidcFields = {
  OIDC_ISSUER: z.string().url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
};

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    OIDC_ISSUER: z.string().url().optional(),
    OIDC_CLIENT_ID: z.string().min(1).optional(),
    OIDC_CLIENT_SECRET: z.string().min(1).optional(),
    SESSION_SECRET: z.string().min(32).optional(),
    OIDC_REDIRECT_URI: z.string().url().optional(),
    OIDC_SCOPES: z.string().default("openid email profile groups offline_access"),
    SESSION_MAX_AGE: z.coerce.number().int().positive().default(86400),
    KUBECONFIG: z.string().optional(),
    READ_ONLY: z.enum(["true", "false"]).default("false"),
    KUBE_PROXY_ALLOWLIST_DISABLED: z.enum(["true", "false"]).default("false"),
    WATCH_ENABLED: z.enum(["true", "false"]).default("false"),
    PROMETHEUS_URL: z.string().url().optional(),
    HUBBLE_RELAY_ADDRESS: z.string().optional(),
    HUBBLE_RELAY_TLS_CA: z.string().optional(),
    HUBBLE_RELAY_TLS_CERT: z.string().optional(),
    HUBBLE_RELAY_TLS_KEY: z.string().optional(),
    HUBBLE_RELAY_TLS_SERVER_NAME: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const set = Object.keys(oidcFields).filter(
      (k) => data[k as keyof typeof oidcFields] !== undefined,
    );
    const missing = Object.keys(oidcFields).filter(
      (k) => data[k as keyof typeof oidcFields] === undefined,
    );
    if (set.length > 0 && missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Partial OIDC config: ${set.join(", ")} set but ${missing.join(", ")} missing. Set all 4 or none.`,
      });
    }
  });

export const env = envSchema.parse(process.env);

export const authEnabled =
  env.OIDC_ISSUER !== undefined &&
  env.OIDC_CLIENT_ID !== undefined &&
  env.OIDC_CLIENT_SECRET !== undefined &&
  env.SESSION_SECRET !== undefined;

export const readOnly = env.READ_ONLY === "true";

export const kubeProxyAllowlistDisabled = env.KUBE_PROXY_ALLOWLIST_DISABLED === "true";

export function hubbleOptions(): import("./hubble.js").HubbleOptions | null {
  if (!env.HUBBLE_RELAY_ADDRESS) return null;
  const tls =
    env.HUBBLE_RELAY_TLS_CA || env.HUBBLE_RELAY_TLS_CERT || env.HUBBLE_RELAY_TLS_KEY
      ? {
          ca: env.HUBBLE_RELAY_TLS_CA,
          cert: env.HUBBLE_RELAY_TLS_CERT,
          key: env.HUBBLE_RELAY_TLS_KEY,
          serverNameOverride: env.HUBBLE_RELAY_TLS_SERVER_NAME,
        }
      : undefined;
  return { address: env.HUBBLE_RELAY_ADDRESS, tls };
}

export const watchEnabled = env.WATCH_ENABLED === "true";
export const prometheusUrl = env.PROMETHEUS_URL;
