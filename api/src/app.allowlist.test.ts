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

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createServer, type Server, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import type { KubeProxyConfig } from "./kube-config.js";

let upstream: Server;
let upstreamUrl: string;
let upstreamRequests: IncomingMessage[];

beforeAll(async () => {
  upstream = createServer((req, res) => {
    upstreamRequests.push(req);
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

afterEach(() => {
  upstreamRequests = [];
});

function makeApp(allowlistDisabled?: boolean): Promise<FastifyInstance> {
  const config: KubeProxyConfig = { upstream: upstreamUrl, rejectUnauthorized: false };
  return buildApp({
    config,
    authEnabled: false,
    readOnly: false,
    allowlistDisabled,
    logger: false,
  });
}

describe("kube proxy path allowlist", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    upstreamRequests = [];
    app = await makeApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("allows a whitelisted path and forwards it upstream", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/kube/apis/kubelb.k8c.io/v1alpha1/tenants",
    });
    expect(res.statusCode).toBe(200);
    expect(upstreamRequests).toHaveLength(1);
  });

  it("denies a disallowed path with 403 and never hits the upstream", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/kube/apis/rbac.authorization.k8s.io/v1/clusterroles",
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toMatchObject({ error: "path not allowed" });
    expect(upstreamRequests).toHaveLength(0);
  });

  describe("when KUBE_PROXY_ALLOWLIST_DISABLED is true", () => {
    let disabledApp: FastifyInstance;

    beforeAll(async () => {
      disabledApp = await makeApp(true);
    });

    afterAll(async () => {
      await disabledApp.close();
    });

    it("allows a normally-disallowed path through to the upstream", async () => {
      const res = await disabledApp.inject({
        method: "GET",
        url: "/api/kube/apis/rbac.authorization.k8s.io/v1/clusterroles",
      });
      expect(res.statusCode).toBe(200);
    });
  });
});
