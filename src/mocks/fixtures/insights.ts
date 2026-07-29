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

import type { Insight } from "@/types/kubelb";

const DOCS = "https://docs.kubermatic.com/kubelb/main/insights/checks";

function labels(check: string, severity: string, category: string): Record<string, string> {
  return {
    "kubelb.k8c.io/insight-check": check,
    "kubelb.k8c.io/insight-severity": severity,
    "kubelb.k8c.io/insight-category": category,
  };
}

export const insights: Insight[] = [
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb021-0a9d4e66",
      namespace: "tenant-primary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d001",
      resourceVersion: "2201",
      creationTimestamp: "2026-07-28T09:12:04Z",
      labels: labels("KLB021", "critical", "reliability"),
    },
    spec: {
      check: "KLB021",
      slug: "xds-snapshot-missing",
      category: "reliability",
      severity: "critical",
      message:
        "Tenant primary has 3 admitted routes but the Envoy control plane snapshot holds nothing for it. Its dataplane is serving no traffic.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Tenant",
          name: "primary",
        },
      ],
      evidence: [
        {
          type: "Condition",
          ref: "TenantState/primary#EnvoySnapshotPresent",
          note: "Snapshot missing while admitted configuration exists",
        },
      ],
      remediation: {
        summary:
          "Check the manager logs for the Envoy control plane controller and this tenant's namespace. The configuration exists and was admitted, so the gap sits between admission and the snapshot.",
      },
      docsURL: `${DOCS}/#klb021`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-28T09:12:04Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb014-3fa2c81b",
      namespace: "tenant-primary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d002",
      resourceVersion: "2202",
      creationTimestamp: "2026-07-25T11:03:44Z",
      labels: labels("KLB014", "high", "reliability"),
    },
    spec: {
      check: "KLB014",
      slug: "hostname-collision",
      category: "reliability",
      severity: "high",
      message:
        "Ingress shop claims api.example.com, also claimed by secondary. Traffic for it resolves to whichever claim the dataplane programmed last.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Route",
          name: "4f2c1a90-6d7e-4b2a-9c1d-3e5f7a8b9c0d",
          namespace: "tenant-primary",
        },
      ],
      evidence: [
        {
          type: "ObjectRef",
          ref: "Route/4f2c1a90-6d7e-4b2a-9c1d-3e5f7a8b9c0d",
          note: "Claims api.example.com",
        },
      ],
      remediation: {
        summary:
          "Decide which tenant owns the hostname and change the other, or scope the hostname per tenant with spec.allowedDomains so the conflict cannot recur.",
        snippet:
          'apiVersion: kubelb.k8c.io/v1alpha1\nkind: Tenant\nmetadata:\n  name: primary\nspec:\n  allowedDomains:\n    - "*.primary.example.com"',
      },
      docsURL: `${DOCS}/#klb014`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-25T11:03:44Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb014-77e01c2d",
      namespace: "tenant-secondary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d003",
      resourceVersion: "2203",
      creationTimestamp: "2026-07-25T11:03:44Z",
      labels: labels("KLB014", "high", "reliability"),
    },
    spec: {
      check: "KLB014",
      slug: "hostname-collision",
      category: "reliability",
      severity: "high",
      message:
        "HTTPRoute storefront claims api.example.com, also claimed by primary. Traffic for it resolves to whichever claim the dataplane programmed last.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Route",
          name: "b7d3e2f1-8a9c-4d5e-b6f7-1a2b3c4d5e6f",
          namespace: "tenant-secondary",
        },
      ],
      remediation: {
        summary:
          "Decide which tenant owns the hostname and change the other, or scope the hostname per tenant with spec.allowedDomains so the conflict cannot recur.",
      },
      docsURL: `${DOCS}/#klb014`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-25T11:03:44Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb002-9f31ab04",
      namespace: "kubelb",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d004",
      resourceVersion: "2204",
      creationTimestamp: "2026-07-27T15:40:12Z",
      labels: labels("KLB002", "high", "security"),
    },
    spec: {
      check: "KLB002",
      slug: "waf-validation-disabled",
      category: "security",
      severity: "high",
      message:
        "spec.waf.skipValidation is set while 3 WAF policies exist. Every policy is reported as valid without its directives being parsed.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Config",
          name: "default",
          namespace: "kubelb",
        },
      ],
      evidence: [
        {
          type: "FieldRef",
          ref: "Config/default#spec.waf.skipValidation",
          note: "Validation disabled fleet-wide",
        },
      ],
      remediation: {
        summary: "Unset the field and fix whichever policy then fails validation.",
        snippet:
          "apiVersion: kubelb.k8c.io/v1alpha1\nkind: Config\nmetadata:\n  name: default\n  namespace: kubelb\nspec:\n  waf:\n    skipValidation: false",
      },
      docsURL: `${DOCS}/#klb002`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-27T15:40:12Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb016-5b8f02aa",
      namespace: "tenant-primary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d005",
      resourceVersion: "2205",
      creationTimestamp: "2026-07-20T08:15:30Z",
      labels: labels("KLB016", "high", "security"),
    },
    spec: {
      check: "KLB016",
      slug: "waf-unprotected-route",
      category: "security",
      severity: "high",
      message:
        "Route web-frontend serves HTTP traffic with no WAF policy while 4 of 6 tenants with public routes enforce WAF.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Route",
          name: "web-frontend",
          namespace: "tenant-primary",
        },
      ],
      remediation: {
        summary:
          "Attach a WAFPolicy to the route, or set one with spec.global to cover everything without a policy of its own.",
      },
      docsURL: `${DOCS}/#klb016`,
      triage: {
        state: "Acknowledged",
      },
    },
    status: {
      state: "Acknowledged",
      firstSeen: "2026-07-20T08:15:30Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb018-c41d9e77",
      namespace: "tenant-primary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d006",
      resourceVersion: "2206",
      creationTimestamp: "2026-07-28T22:01:55Z",
      labels: labels("KLB018", "medium", "reliability"),
    },
    spec: {
      check: "KLB018",
      slug: "quota-headroom",
      category: "reliability",
      severity: "medium",
      message:
        "Tenant primary is at 8 of 10 load balancers (80%). Past the limit, new resources are refused with nothing but a controller log to explain it.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Tenant",
          name: "primary",
        },
      ],
      evidence: [
        {
          type: "FieldRef",
          ref: "Tenant/primary#spec.loadBalancer.limit",
          note: "Limit 10, usage 8",
        },
      ],
      remediation: {
        summary:
          "Raise the limit on the Tenant or Config, or have the tenant remove what it no longer uses.",
      },
      docsURL: `${DOCS}/#klb018`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-28T22:01:55Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb011-e19a4f30",
      namespace: "tenant-secondary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d007",
      resourceVersion: "2207",
      creationTimestamp: "2026-07-18T13:27:09Z",
      labels: labels("KLB011", "medium", "security"),
    },
    spec: {
      check: "KLB011",
      slug: "reference-grants-disabled",
      category: "security",
      severity: "medium",
      message:
        "Tenant secondary accepts cross-namespace references without a ReferenceGrant while its peers require one.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Tenant",
          name: "secondary",
        },
      ],
      remediation: {
        summary:
          "Set spec.gatewayAPI.enforceReferenceGrants on the Tenant, or on the Config for everyone.",
      },
      docsURL: `${DOCS}/#klb011`,
      triage: {
        state: "Dismissed",
        reason: "working_as_intended",
      },
    },
    status: {
      state: "Dismissed",
      firstSeen: "2026-07-18T13:27:09Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb013-8d2b1c55",
      namespace: "tenant-secondary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d008",
      resourceVersion: "2208",
      creationTimestamp: "2026-07-26T17:52:41Z",
      labels: labels("KLB013", "medium", "migration"),
    },
    spec: {
      check: "KLB013",
      slug: "ingress-conversion-stuck",
      category: "migration",
      severity: "medium",
      message:
        "Ingress legacy-shop did not finish converting to Gateway API and has been stuck as partial for 2 days.",
      targetRefs: [
        {
          apiVersion: "networking.k8s.io/v1",
          kind: "Ingress",
          name: "legacy-shop",
          namespace: "tenant-secondary",
        },
      ],
      remediation: {
        summary:
          "Read kubelb.k8c.io/conversion-warnings on the source Ingress and fix what the converter could not translate, or annotate it with kubelb.k8c.io/skip-conversion to leave it as an Ingress.",
      },
      docsURL: `${DOCS}/#klb013`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-26T17:52:41Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb010-1f7a3d90",
      namespace: "tenant-primary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d009",
      resourceVersion: "2209",
      creationTimestamp: "2026-07-15T10:00:00Z",
      labels: labels("KLB010", "info", "hygiene"),
    },
    spec: {
      check: "KLB010",
      slug: "deprecated-proxy-topology",
      category: "hygiene",
      severity: "info",
      message:
        "spec.envoyProxy.topology is dedicated. It is deprecated, already behaves as shared, and will fail a future upgrade if left in place.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Tenant",
          name: "primary",
        },
      ],
      evidence: [
        {
          type: "FieldRef",
          ref: "Tenant/primary#spec.envoyProxy.topology",
        },
      ],
      remediation: {
        summary: "Set spec.envoyProxy.topology to shared.",
      },
      docsURL: `${DOCS}/#klb010`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-15T10:00:00Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb001-6c0e8b12",
      namespace: "tenant-secondary",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d010",
      resourceVersion: "2210",
      creationTimestamp: "2026-07-10T09:30:00Z",
      labels: labels("KLB001", "medium", "security"),
    },
    spec: {
      check: "KLB001",
      slug: "waf-detection-only",
      category: "security",
      severity: "medium",
      message:
        "WAF policy staging-protection has run with SecRuleEngine DetectionOnly for 19 days. It inspects and logs, and blocks nothing.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "WAFPolicy",
          name: "staging-protection",
        },
      ],
      remediation: {
        summary:
          "Set SecRuleEngine On in the policy directives, or delete the policy if it is no longer wanted.",
      },
      docsURL: `${DOCS}/#klb001`,
      triage: {
        state: "Snoozed",
        snoozeUntil: "2026-08-15T00:00:00Z",
      },
    },
    status: {
      state: "Snoozed",
      firstSeen: "2026-07-10T09:30:00Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
  {
    apiVersion: "kubelb.k8c.io/v1alpha1",
    kind: "Insight",
    metadata: {
      name: "klb005-2e6b7f01",
      namespace: "kubelb",
      uid: "7c1f5a02-4a37-4a1e-9a63-b1f0a3c2d011",
      resourceVersion: "2211",
      creationTimestamp: "2026-07-29T06:10:22Z",
      labels: labels("KLB005", "low", "cost"),
    },
    spec: {
      check: "KLB005",
      slug: "ai-spend-metering-disabled",
      category: "cost",
      severity: "low",
      message:
        "The AI gateway is in use and no Prometheus is configured, so no key reports its spend and Week and Month budgets are not enforced.",
      targetRefs: [
        {
          apiVersion: "kubelb.k8c.io/v1alpha1",
          kind: "Config",
          name: "default",
          namespace: "kubelb",
        },
      ],
      remediation: {
        summary: "Set spec.prometheus on the Config.",
      },
      docsURL: `${DOCS}/#klb005`,
    },
    status: {
      state: "Open",
      firstSeen: "2026-07-29T06:10:22Z",
      lastEvaluated: "2026-07-29T07:24:07Z",
    },
  },
];
