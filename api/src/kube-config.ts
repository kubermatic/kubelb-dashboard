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

import { KubeConfig } from "@kubernetes/client-node";
import { readFileSync, existsSync } from "node:fs";

const SA_TOKEN_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/token";

export interface KubeProxyConfig {
  upstream: string;
  ca?: string | Buffer;
  cert?: string | Buffer;
  key?: string | Buffer;
  rejectUnauthorized: boolean;
  token?: string;
  tokenFile?: string;
}

export function loadKubeProxyConfig(): KubeProxyConfig {
  const kc = new KubeConfig();
  kc.loadFromDefault();

  const cluster = kc.getCurrentCluster();
  if (!cluster) {
    throw new Error("No active cluster found in kubeconfig");
  }

  const user = kc.getCurrentUser();
  if (!user) {
    throw new Error("No active user found in kubeconfig");
  }

  const config: KubeProxyConfig = {
    upstream: cluster.server,
    rejectUnauthorized: !cluster.skipTLSVerify,
  };

  if (cluster.caFile) {
    config.ca = readFileSync(cluster.caFile);
  } else if (cluster.caData) {
    config.ca = Buffer.from(cluster.caData, "base64");
  }

  if (user.certFile && user.keyFile) {
    config.cert = readFileSync(user.certFile);
    config.key = readFileSync(user.keyFile);
  } else if (user.certData && user.keyData) {
    config.cert = Buffer.from(user.certData, "base64");
    config.key = Buffer.from(user.keyData, "base64");
  } else if (user.token) {
    config.token = user.token;
  }

  if (existsSync(SA_TOKEN_PATH)) {
    config.tokenFile = SA_TOKEN_PATH;
  }

  return config;
}

export function getAuthToken(config: KubeProxyConfig): string | undefined {
  if (config.tokenFile) {
    return readFileSync(config.tokenFile, "utf-8").trim();
  }
  return config.token;
}
