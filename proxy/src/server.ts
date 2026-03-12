import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import websocket from "@fastify/websocket";
import { loadKubeProxyConfig } from "./kube-config.js";

const port = parseInt(process.env["PORT"] ?? "3001", 10);
const kubeconfigPath = process.env["KUBECONFIG"];

if (!kubeconfigPath) {
  console.error("KUBECONFIG environment variable is not set. Exiting.");
  process.exit(1);
}

const config = loadKubeProxyConfig(kubeconfigPath);

const app = Fastify({ logger: true });

await app.register(websocket);

await app.register(proxy, {
  upstream: config.upstream,
  prefix: "/api/kube",
  rewritePrefix: "",
  websocket: true,
  undici: {
    connect: {
      ca: config.ca?.toString(),
      cert: config.cert?.toString(),
      key: config.key?.toString(),
      rejectUnauthorized: config.rejectUnauthorized,
    },
  },
  replyOptions: {
    rewriteRequestHeaders: (_originalReq, headers) => {
      if (config.token) {
        return { ...headers, authorization: `Bearer ${config.token}` };
      }
      return headers;
    },
  },
});

app.get("/healthz", async () => ({ status: "ok" }));

await app.listen({ port, host: "0.0.0.0" });
