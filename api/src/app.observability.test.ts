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

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CoreV1Api } from "@kubernetes/client-node";
import { buildApp, type BuildAppOptions } from "./app.js";
import type { KubeProxyConfig } from "./kube-config.js";

const config: KubeProxyConfig = { upstream: "http://127.0.0.1:1", rejectUnauthorized: false };

function spyCore() {
  return {
    listServiceForAllNamespaces: vi.fn(() => Promise.resolve({ items: [] })),
    readNamespacedService: vi.fn(() => Promise.reject(new Error("not found"))),
    readNamespacedSecret: vi.fn(() => Promise.reject(new Error("not found"))),
  };
}

function makeApp(opts: Partial<BuildAppOptions>): Promise<FastifyInstance> {
  return buildApp({ config, authEnabled: false, logger: false, hubble: null, ...opts });
}

describe("observability source gating", () => {
  const apps: FastifyInstance[] = [];
  afterAll(async () => {
    await Promise.all(apps.map((a) => a.close()));
  });

  it("reports unavailable and never touches the cluster when auto-discovery is off", async () => {
    const core = spyCore();
    const app = await makeApp({
      coreClient: core as unknown as CoreV1Api,
      hubbleAutodiscover: false,
      prometheusAutodiscover: false,
      prometheusUrl: undefined,
    });
    apps.push(app);

    const traffic = await app.inject({ method: "GET", url: "/api/traffic/sources" });
    const obs = await app.inject({ method: "GET", url: "/api/observability/sources" });

    expect(traffic.json()).toEqual({ hubble: { available: false, source: null } });
    expect(obs.json().metrics).toEqual({ available: false, source: null });
    expect(core.listServiceForAllNamespaces).not.toHaveBeenCalled();
    expect(core.readNamespacedService).not.toHaveBeenCalled();
  });

  it("runs discovery and fails closed when the cluster has no relay or prometheus", async () => {
    const core = spyCore();
    const app = await makeApp({
      coreClient: core as unknown as CoreV1Api,
      hubbleAutodiscover: true,
      prometheusAutodiscover: true,
      prometheusUrl: undefined,
    });
    apps.push(app);

    const traffic = await app.inject({ method: "GET", url: "/api/traffic/sources" });
    const obs = await app.inject({ method: "GET", url: "/api/observability/sources" });

    expect(traffic.json()).toEqual({ hubble: { available: false, source: null } });
    expect(obs.json().metrics).toEqual({ available: false, source: null });
    // Discovery was actually attempted.
    expect(core.listServiceForAllNamespaces).toHaveBeenCalled();
    expect(core.readNamespacedService).toHaveBeenCalled();
  });

  it("flow/graph endpoints 404 when traffic is unavailable", async () => {
    const app = await makeApp({
      coreClient: null,
      hubbleAutodiscover: false,
      prometheusAutodiscover: false,
    });
    apps.push(app);
    const flows = await app.inject({ method: "GET", url: "/api/traffic/flows?window=5m" });
    expect(flows.statusCode).toBe(404);
  });

  it("ai spend endpoint 404s when metrics are unavailable", async () => {
    const app = await makeApp({
      coreClient: null,
      hubbleAutodiscover: false,
      prometheusAutodiscover: false,
    });
    apps.push(app);
    const res = await app.inject({
      method: "GET",
      url: "/api/metrics/ai?metric=tokens&window=24h",
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("ai spend endpoint with prometheus available", () => {
  const apps: FastifyInstance[] = [];
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await Promise.all(apps.map((a) => a.close()));
  });

  // Detection probes the envoy series; the AI query returns a vector.
  function stubProm() {
    vi.stubGlobal(
      "fetch",
      vi.fn((u: string | URL) => {
        const url = String(u);
        if (url.includes("envoy_http_downstream_rq_total")) {
          return Promise.resolve(
            Response.json({ status: "success", data: { result: [{ value: [0, "5"] }] } }),
          );
        }
        return Promise.resolve(
          Response.json({
            status: "success",
            data: {
              resultType: "vector",
              result: [{ metric: { tenant_id: "primary" }, value: [0, "42"] }],
            },
          }),
        );
      }),
    );
  }

  it("returns a vector for a valid query", async () => {
    stubProm();
    const app = await makeApp({ prometheusUrl: "http://prom:9090", coreClient: null });
    apps.push(app);
    const res = await app.inject({ method: "GET", url: "/api/metrics/ai?metric=tokens&window=1h" });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.result).toHaveLength(1);
  });

  it("rejects an unknown metric with 400", async () => {
    stubProm();
    const app = await makeApp({ prometheusUrl: "http://prom:9090", coreClient: null });
    apps.push(app);
    const res = await app.inject({ method: "GET", url: "/api/metrics/ai?metric=evil&window=1h" });
    expect(res.statusCode).toBe(400);
  });
});
