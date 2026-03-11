import { KubeConfig } from "@kubernetes/client-node";
import { readFileSync } from "node:fs";

export interface KubeProxyConfig {
  upstream: string;
  ca?: string | Buffer;
  cert?: string | Buffer;
  key?: string | Buffer;
  rejectUnauthorized: boolean;
  token?: string;
}

export function loadKubeProxyConfig(kubeconfigPath?: string): KubeProxyConfig {
  const kc = new KubeConfig();

  if (kubeconfigPath) {
    kc.loadFromFile(kubeconfigPath);
  } else {
    kc.loadFromDefault();
  }

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

  return config;
}
