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

import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoreV1Api } from "@kubernetes/client-node";
import { discoverHubble, discoverPrometheus, WELL_KNOWN_PROMETHEUS } from "./discovery.js";

afterEach(() => vi.restoreAllMocks());

interface SvcSpec {
  name: string;
  namespace: string;
  port?: number;
}

function service({ name, namespace, port }: SvcSpec) {
  return {
    metadata: { name, namespace },
    spec: { ports: port === undefined ? [] : [{ port }] },
  };
}

// Minimal CoreV1Api stub: only the three read methods discovery uses.
function fakeCore(overrides: Partial<Record<string, unknown>>): CoreV1Api {
  const notFound = () => Promise.reject(new Error("not found"));
  return {
    listServiceForAllNamespaces:
      overrides.listServiceForAllNamespaces ?? (() => Promise.resolve({ items: [] })),
    readNamespacedService: overrides.readNamespacedService ?? notFound,
    readNamespacedSecret: overrides.readNamespacedSecret ?? notFound,
  } as unknown as CoreV1Api;
}

function mockFetch(impl: (url: string) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((u: string | URL) => Promise.resolve(impl(String(u)))),
  );
}

const promSuccess = (hasSeries: boolean) =>
  new Response(JSON.stringify({ status: "success", data: { result: hasSeries ? [1] : [] } }), {
    status: 200,
  });

describe("discoverHubble", () => {
  it("returns a plaintext address for a port-80 relay found by label", async () => {
    const core = fakeCore({
      listServiceForAllNamespaces: () =>
        Promise.resolve({
          items: [service({ name: "hubble-relay", namespace: "kube-system", port: 80 })],
        }),
    });
    expect(await discoverHubble(core)).toEqual({ address: "hubble-relay.kube-system.svc:80" });
  });

  it("picks the gRPC port when the relay Service exposes multiple ports", async () => {
    const core = fakeCore({
      listServiceForAllNamespaces: () =>
        Promise.resolve({
          items: [
            {
              metadata: { name: "hubble-relay", namespace: "kube-system" },
              spec: {
                ports: [
                  { name: "metrics", port: 9965 },
                  { name: "grpc", port: 80 },
                ],
              },
            },
          ],
        }),
    });
    expect(await discoverHubble(core)).toEqual({ address: "hubble-relay.kube-system.svc:80" });
  });

  it("loads mTLS certs from the secret for a port-443 relay", async () => {
    const b64 = (s: string) => Buffer.from(s).toString("base64");
    const core = fakeCore({
      listServiceForAllNamespaces: () =>
        Promise.resolve({
          items: [service({ name: "hubble-relay", namespace: "cilium", port: 443 })],
        }),
      readNamespacedSecret: () =>
        Promise.resolve({
          data: { "ca.crt": b64("CA"), "tls.crt": b64("CERT"), "tls.key": b64("KEY") },
        }),
    });
    const opts = await discoverHubble(core);
    expect(opts?.address).toBe("hubble-relay.cilium.svc:443");
    expect(opts?.tls?.caData?.toString()).toBe("CA");
    expect(opts?.tls?.certData?.toString()).toBe("CERT");
    expect(opts?.tls?.keyData?.toString()).toBe("KEY");
    expect(opts?.tls?.serverNameOverride).toBe("hubble-relay.cilium.svc.cluster.local");
  });

  it("returns null when a 443 relay's cert secret is missing keys", async () => {
    const core = fakeCore({
      listServiceForAllNamespaces: () =>
        Promise.resolve({
          items: [service({ name: "hubble-relay", namespace: "cilium", port: 443 })],
        }),
      readNamespacedSecret: () => Promise.resolve({ data: { "ca.crt": "eA==" } }),
    });
    expect(await discoverHubble(core)).toBeNull();
  });

  it("falls back to reading hubble-relay by name when the label matches nothing", async () => {
    const readNamespacedService = vi.fn((p: { name: string; namespace: string }) =>
      p.namespace === "kube-system"
        ? Promise.resolve(service({ name: "hubble-relay", namespace: "kube-system", port: 80 }))
        : Promise.reject(new Error("not found")),
    );
    const core = fakeCore({ readNamespacedService });
    expect(await discoverHubble(core)).toEqual({ address: "hubble-relay.kube-system.svc:80" });
  });

  it("returns null when no relay exists anywhere", async () => {
    expect(await discoverHubble(fakeCore({}))).toBeNull();
  });

  it("fails closed when the API call throws", async () => {
    const core = fakeCore({ listServiceForAllNamespaces: () => Promise.reject(new Error("boom")) });
    expect(await discoverHubble(core)).toBeNull();
  });
});

describe("discoverPrometheus", () => {
  it("returns the first well-known service that exposes the envoy series", async () => {
    // Only monitoring/prometheus exists; earlier candidates 404.
    const core = fakeCore({
      readNamespacedService: (p: { name: string; namespace: string }) =>
        p.namespace === "monitoring" && p.name === "prometheus"
          ? Promise.resolve(service({ name: "prometheus", namespace: "monitoring", port: 9090 }))
          : Promise.reject(new Error("not found")),
    });
    mockFetch(() => promSuccess(true));
    expect(await discoverPrometheus(core)).toBe("http://prometheus.monitoring.svc:9090");
  });

  it("skips a service that responds but lacks the envoy series", async () => {
    const core = fakeCore({
      readNamespacedService: (p: { name: string; namespace: string }) =>
        p.name === "prometheus"
          ? Promise.resolve(service({ name: "prometheus", namespace: p.namespace, port: 9090 }))
          : Promise.reject(new Error("not found")),
    });
    // monitoring/prometheus has no series; kube-system/prometheus does.
    mockFetch((url) => promSuccess(url.includes("kube-system")));
    expect(await discoverPrometheus(core)).toBe("http://prometheus.kube-system.svc:9090");
  });

  it("uses the service's own port when the candidate port is 0", async () => {
    const core = fakeCore({
      readNamespacedService: (p: { name: string; namespace: string }) =>
        p.namespace === "monitoring" && p.name === "prometheus-server"
          ? Promise.resolve(
              service({ name: "prometheus-server", namespace: "monitoring", port: 80 }),
            )
          : Promise.reject(new Error("not found")),
    });
    mockFetch(() => promSuccess(true));
    expect(await discoverPrometheus(core)).toBe("http://prometheus-server.monitoring.svc:80");
  });

  it("returns null when no candidate exists", async () => {
    mockFetch(() => promSuccess(true));
    expect(await discoverPrometheus(fakeCore({}))).toBeNull();
  });
});

describe("WELL_KNOWN_PROMETHEUS", () => {
  it("covers common installs and orders operator services before plain ones", () => {
    const keys = WELL_KNOWN_PROMETHEUS.map((c) => `${c.namespace}/${c.service}`);
    expect(keys).toContain("monitoring/kube-prometheus-stack-prometheus");
    expect(keys).toContain("monitoring/vmselect");
    const stackIdx = keys.indexOf("monitoring/kube-prometheus-stack-prometheus");
    const serverIdx = keys.indexOf("monitoring/prometheus-server");
    expect(stackIdx).toBeLessThan(serverIdx);
  });
});
