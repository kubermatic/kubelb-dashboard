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

import { describe, it, expect } from "vitest";
import { getRouteHealthStatus, getLoadBalancerHealthStatus } from "../status-mapper";
import type { Route, LoadBalancer } from "@/types/kubelb";

function makeRoute(kind: string, upstreamStatus: Record<string, unknown>): Route {
  return {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Route",
    metadata: { name: "test", creationTimestamp: "" },
    spec: {},
    status: {
      resources: {
        route: {
          kind,
          name: "test",
          conditions: [
            {
              type: "ResourceAppliedSuccessfully",
              status: "True",
              lastTransitionTime: "",
              reason: "InstallationSuccessful",
              message: "Success",
            },
          ],
          status: upstreamStatus,
        },
      },
    },
  };
}

describe("getRouteHealthStatus", () => {
  describe("Gateway", () => {
    it("returns Ready when Accepted=True and Programmed=True", () => {
      const route = makeRoute("Gateway", {
        conditions: [
          {
            type: "Accepted",
            status: "True",
            reason: "Accepted",
            message: "",
            lastTransitionTime: "",
          },
          {
            type: "Programmed",
            status: "True",
            reason: "Programmed",
            message: "",
            lastTransitionTime: "",
          },
        ],
      });
      expect(getRouteHealthStatus(route)).toEqual({ state: "Ready", reason: "Programmed" });
    });

    it("returns Degraded when Accepted=True but Programmed=False", () => {
      const route = makeRoute("Gateway", {
        conditions: [
          {
            type: "Accepted",
            status: "True",
            reason: "Accepted",
            message: "",
            lastTransitionTime: "",
          },
          {
            type: "Programmed",
            status: "False",
            reason: "AddressNotAssigned",
            message: "No address",
            lastTransitionTime: "",
          },
        ],
      });
      const result = getRouteHealthStatus(route);
      expect(result.state).toBe("Degraded");
    });

    it("returns Error when Accepted=False", () => {
      const route = makeRoute("Gateway", {
        conditions: [
          {
            type: "Accepted",
            status: "False",
            reason: "InvalidParameters",
            message: "bad",
            lastTransitionTime: "",
          },
          {
            type: "Programmed",
            status: "False",
            reason: "Invalid",
            message: "",
            lastTransitionTime: "",
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Error");
    });

    it("returns Pending when conditions missing", () => {
      const route = makeRoute("Gateway", {});
      expect(getRouteHealthStatus(route).state).toBe("Pending");
    });
  });

  it("returns Pending when no status.resources", () => {
    const route: Route = {
      apiVersion: "kubelb.k8c.io/v1alpha1",
      kind: "Route",
      metadata: { name: "test", creationTimestamp: "" },
      spec: {},
    };
    expect(getRouteHealthStatus(route)).toEqual({ state: "Pending" });
  });

  it("returns Pending for unknown kind", () => {
    const route = makeRoute("SomeUnknownKind", {});
    expect(getRouteHealthStatus(route).state).toBe("Pending");
  });

  describe("HTTPRoute / GRPCRoute", () => {
    it("returns Ready when all parents Accepted=True and ResolvedRefs=True", () => {
      const route = makeRoute("HTTPRoute", {
        parents: [
          {
            conditions: [
              { type: "Accepted", status: "True", reason: "Accepted", message: "" },
              { type: "ResolvedRefs", status: "True", reason: "ResolvedRefs", message: "" },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Ready");
    });

    it("returns Degraded when BackendsAvailable=False", () => {
      const route = makeRoute("HTTPRoute", {
        parents: [
          {
            conditions: [
              { type: "Accepted", status: "True", reason: "Accepted", message: "" },
              { type: "ResolvedRefs", status: "True", reason: "ResolvedRefs", message: "" },
              {
                type: "BackendsAvailable",
                status: "False",
                reason: "EndpointsNotFound",
                message: "no endpoints",
              },
            ],
          },
        ],
      });
      const result = getRouteHealthStatus(route);
      expect(result.state).toBe("Degraded");
      expect(result.reason).toBe("EndpointsNotFound");
    });

    it("returns Error when Accepted=False", () => {
      const route = makeRoute("HTTPRoute", {
        parents: [
          {
            conditions: [
              { type: "Accepted", status: "False", reason: "NotAllowedByListeners", message: "" },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Error");
    });

    it("returns Error when ResolvedRefs=False", () => {
      const route = makeRoute("GRPCRoute", {
        parents: [
          {
            conditions: [
              { type: "Accepted", status: "True", reason: "Accepted", message: "" },
              { type: "ResolvedRefs", status: "False", reason: "BackendNotFound", message: "" },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Error");
    });

    it("returns Pending with empty parents", () => {
      const route = makeRoute("HTTPRoute", { parents: [] });
      expect(getRouteHealthStatus(route).state).toBe("Pending");
    });
  });

  describe("TCPRoute / UDPRoute / TLSRoute", () => {
    it("returns Ready when Accepted=True and ResolvedRefs=True", () => {
      const route = makeRoute("TCPRoute", {
        parents: [
          {
            conditions: [
              { type: "Accepted", status: "True", reason: "Accepted", message: "" },
              { type: "ResolvedRefs", status: "True", reason: "ResolvedRefs", message: "" },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Ready");
    });

    it("returns Error when ResolvedRefs=False", () => {
      const route = makeRoute("UDPRoute", {
        parents: [
          {
            conditions: [
              { type: "Accepted", status: "True", reason: "Accepted", message: "" },
              { type: "ResolvedRefs", status: "False", reason: "BackendNotFound", message: "" },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Error");
    });

    it("handles TLSRoute the same way", () => {
      const route = makeRoute("TLSRoute", {
        parents: [
          {
            conditions: [
              { type: "Accepted", status: "True", reason: "Accepted", message: "" },
              { type: "ResolvedRefs", status: "True", reason: "ResolvedRefs", message: "" },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Ready");
    });
  });

  describe("Ingress", () => {
    it("returns Ready when loadBalancer.ingress has entries", () => {
      const route = makeRoute("Ingress", {
        loadBalancer: { ingress: [{ ip: "1.2.3.4" }] },
      });
      expect(getRouteHealthStatus(route).state).toBe("Ready");
    });

    it("returns Pending when loadBalancer.ingress is empty", () => {
      const route = makeRoute("Ingress", {
        loadBalancer: { ingress: [] },
      });
      expect(getRouteHealthStatus(route).state).toBe("Pending");
    });

    it("returns Pending when loadBalancer is empty object", () => {
      const route = makeRoute("Ingress", { loadBalancer: {} });
      expect(getRouteHealthStatus(route).state).toBe("Pending");
    });
  });

  describe("BackendTrafficPolicy / ClientTrafficPolicy", () => {
    it("returns Ready when Accepted=True", () => {
      const route = makeRoute("BackendTrafficPolicy", {
        ancestors: [
          {
            conditions: [
              {
                type: "Accepted",
                status: "True",
                reason: "Accepted",
                message: "Policy has been accepted.",
              },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Ready");
    });

    it("returns Degraded when Overridden=True", () => {
      const route = makeRoute("BackendTrafficPolicy", {
        ancestors: [
          {
            conditions: [
              { type: "Accepted", status: "True", reason: "Accepted", message: "" },
              {
                type: "Overridden",
                status: "True",
                reason: "Overridden",
                message: "overridden by route-level",
              },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Degraded");
    });

    it("returns Error when Accepted=False", () => {
      const route = makeRoute("ClientTrafficPolicy", {
        ancestors: [
          {
            conditions: [
              { type: "Accepted", status: "False", reason: "TargetNotFound", message: "" },
            ],
          },
        ],
      });
      expect(getRouteHealthStatus(route).state).toBe("Error");
    });

    it("returns Pending when ancestors is empty", () => {
      const route = makeRoute("BackendTrafficPolicy", {});
      expect(getRouteHealthStatus(route).state).toBe("Pending");
    });
  });

  describe("kind fallback from labels", () => {
    it("uses origin-resource-kind label when route.kind is undefined", () => {
      const route: Route = {
        apiVersion: "kubelb.k8c.io/v1alpha1",
        kind: "Route",
        metadata: {
          name: "test",
          creationTimestamp: "",
          labels: { "kubelb.k8c.io/origin-resource-kind": "Gateway.gateway.networking.k8s.io" },
        },
        spec: {},
        status: {
          resources: {
            route: {
              name: "test",
              status: {
                conditions: [
                  { type: "Accepted", status: "True", reason: "Accepted", message: "" },
                  { type: "Programmed", status: "True", reason: "Programmed", message: "" },
                ],
              },
            },
          },
        },
      };
      expect(getRouteHealthStatus(route).state).toBe("Ready");
    });
  });
});

describe("getLoadBalancerHealthStatus", () => {
  it("returns Ready when ingress has entries", () => {
    const lb: LoadBalancer = {
      apiVersion: "kubelb.k8c.io/v1alpha1",
      kind: "LoadBalancer",
      metadata: { name: "test", creationTimestamp: "" },
      spec: {},
      status: { loadBalancer: { ingress: [{ ip: "1.2.3.4" }] } },
    };
    expect(getLoadBalancerHealthStatus(lb).state).toBe("Ready");
  });

  it("returns Pending when no ingress", () => {
    const lb: LoadBalancer = {
      apiVersion: "kubelb.k8c.io/v1alpha1",
      kind: "LoadBalancer",
      metadata: { name: "test", creationTimestamp: "" },
      spec: {},
    };
    expect(getLoadBalancerHealthStatus(lb).state).toBe("Pending");
  });
});
