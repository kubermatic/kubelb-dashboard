import { KubeConfig } from "@kubernetes/client-node";
import { readFileSync } from "node:fs";
import https from "node:https";

export interface KubeProxyConfig {
  upstream: string;
  agent: https.Agent;
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

  const agentOptions: https.AgentOptions = {
    rejectUnauthorized: true,
  };

  if (cluster.caFile) {
    agentOptions.ca = readFileSync(cluster.caFile);
  } else if (cluster.caData) {
    agentOptions.ca = Buffer.from(cluster.caData, "base64");
  }

  if (cluster.skipTLSVerify) {
    agentOptions.rejectUnauthorized = false;
  }

  let token: string | undefined;

  if (user.certFile && user.keyFile) {
    agentOptions.cert = readFileSync(user.certFile);
    agentOptions.key = readFileSync(user.keyFile);
  } else if (user.certData && user.keyData) {
    agentOptions.cert = Buffer.from(user.certData, "base64");
    agentOptions.key = Buffer.from(user.keyData, "base64");
  } else if (user.token) {
    token = user.token;
  }

  return {
    upstream: cluster.server,
    agent: new https.Agent(agentOptions),
    token,
  };
}
