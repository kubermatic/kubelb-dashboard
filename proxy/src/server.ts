import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import websocket from "@fastify/websocket";
import { loadKubeProxyConfig } from "./kube-config.js";

const port = parseInt(process.env["PORT"] ?? "3001", 10);
const kubeconfigPath = process.env["KUBECONFIG"];

const config = loadKubeProxyConfig(kubeconfigPath);

const app = Fastify({ logger: true });

await app.register(websocket);

await app.register(proxy, {
  upstream: config.upstream,
  prefix: "/api/kube",
  rewritePrefix: "",
  websocket: true,
  http: {
    requestOptions: {
      agent: config.agent,
      headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined,
    },
  },
});

app.get("/healthz", async () => ({ status: "ok" }));

await app.listen({ port, host: "0.0.0.0" });
