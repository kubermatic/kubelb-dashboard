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
import { createServer, type Server } from "node:http";
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

function makeApp(readOnly: boolean): Promise<FastifyInstance> {
  const config: KubeProxyConfig = { upstream: upstreamUrl, rejectUnauthorized: false };
  return buildApp({ config, authEnabled: false, readOnly, logger: false });
}

const KUBE_PATH = "/api/kube/apis/kubelb.k8c.io/v1alpha1/tenants/foo";

describe("read-only mode", () => {
  describe("when enabled", () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await makeApp(true);
    });

    afterAll(async () => {
      await app.close();
    });

    it.each(["POST", "PUT", "PATCH", "DELETE"])(
      "rejects %s on /api/kube with 403",
      async (method) => {
        const res = await app.inject({ method: method as "POST", url: KUBE_PATH });
        expect(res.statusCode).toBe(403);
        expect(res.json()).toMatchObject({ error: expect.stringContaining("read-only") });
      },
    );

    it("allows GET on /api/kube (proxied to upstream)", async () => {
      const res = await app.inject({ method: "GET", url: KUBE_PATH });
      expect(res.statusCode).toBe(200);
    });

    it("reports readOnly: true from /api/config", async () => {
      const res = await app.inject({ method: "GET", url: "/api/config" });
      expect(res.json()).toMatchObject({ readOnly: true });
    });
  });

  describe("when disabled", () => {
    let app: FastifyInstance;

    beforeAll(async () => {
      app = await makeApp(false);
    });

    afterAll(async () => {
      await app.close();
    });

    it("allows POST on /api/kube (proxied to upstream)", async () => {
      const res = await app.inject({ method: "POST", url: KUBE_PATH, payload: {} });
      expect(res.statusCode).toBe(200);
    });

    it("reports readOnly: false from /api/config", async () => {
      const res = await app.inject({ method: "GET", url: "/api/config" });
      expect(res.json()).toMatchObject({ readOnly: false });
    });
  });
});
