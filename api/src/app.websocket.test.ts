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

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer, request, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import type { KubeProxyConfig } from "./kube-config.js";

let upstream: Server;
let upstreamUrl: string;

beforeAll(async () => {
  upstream = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  const { port } = upstream.address() as AddressInfo;
  upstreamUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => upstream.close(() => resolve()));
});

async function makeListeningApp(readOnly: boolean): Promise<{ app: FastifyInstance; url: string }> {
  const config: KubeProxyConfig = { upstream: upstreamUrl, rejectUnauthorized: false };
  const app = await buildApp({ config, authEnabled: false, readOnly, logger: false });
  await app.listen({ port: 0, host: "127.0.0.1" });
  const { port } = app.server.address() as AddressInfo;
  return { app, url: `http://127.0.0.1:${port}` };
}

interface UpgradeAttempt {
  statusCode: number;
  upgraded: boolean;
}

function attemptWebSocketUpgrade(url: string): Promise<UpgradeAttempt> {
  return new Promise((resolve, reject) => {
    const req = request(url, {
      headers: {
        connection: "Upgrade",
        upgrade: "websocket",
        "sec-websocket-key": "dGhlIHNhbXBsZSBub25jZQ==",
        "sec-websocket-version": "13",
      },
    });
    req.on("upgrade", (res, socket) => {
      socket.destroy();
      resolve({ statusCode: res.statusCode ?? 0, upgraded: true });
    });
    req.on("response", (res) => {
      res.resume();
      res.on("end", () => resolve({ statusCode: res.statusCode ?? 0, upgraded: false }));
    });
    req.on("error", reject);
    req.end();
  });
}

const KUBE_PATH = "/api/kube/api/v1/namespaces";

describe("websocket upgrade on /api/kube", () => {
  describe.each([{ readOnly: true }, { readOnly: false }])(
    "with readOnly: $readOnly",
    ({ readOnly }) => {
      let app: FastifyInstance;
      let baseUrl: string;

      beforeAll(async () => {
        ({ app, url: baseUrl } = await makeListeningApp(readOnly));
      });

      afterAll(async () => {
        await app.close();
      });

      it("is not upgraded — onRequest hooks must not be bypassable", async () => {
        const result = await attemptWebSocketUpgrade(`${baseUrl}${KUBE_PATH}`);
        expect(result.upgraded).toBe(false);
        expect(result.statusCode).not.toBe(101);
      });
    },
  );
});
