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

import Fastify from "fastify";
import proxy from "@fastify/http-proxy";
import websocket from "@fastify/websocket";
import { loadKubeProxyConfig, getAuthToken } from "./kube-config.js";

const port = parseInt(process.env["PORT"] ?? "3001", 10);

const config = loadKubeProxyConfig();

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
      const token = getAuthToken(config);
      if (token) {
        return { ...headers, authorization: `Bearer ${token}` };
      }
      return headers;
    },
  },
});

app.get("/healthz", () => ({ status: "ok" }));

await app.listen({ port, host: "0.0.0.0" });
