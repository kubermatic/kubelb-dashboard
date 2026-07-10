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

import { afterAll, describe, expect, it, vi } from "vitest";
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
});
