# CE/EE Field Reference

**Source of truth:** Go API types in the internal [kubelb-ee](https://github.com/kubermatic/kubelb-ee) repository under `api/{ce,ee}/kubelb.k8c.io/v1alpha1/` (Kubermatic maintainers only).

## Rules

1. When adding or displaying resource fields, ALWAYS check whether the field exists in the CE types
2. EE-only fields MUST be gated with `{isEE && ...}` in JSX
3. TypeScript types in `src/types/kubelb.ts` include both CE and EE fields (EE fields are optional `?`)
4. When adding new fields to the dashboard, update this file with their CE/EE status

## How to Update

1. Check the Go API types at the source of truth path above
2. CE types: `api/ce/kubelb.k8c.io/v1alpha1/`
3. EE types: `api/ee/kubelb.k8c.io/v1alpha1/`
4. If a field only exists in EE types, mark it as EE-only below
5. Add `{isEE && ...}` gating in JSX for any EE-only field

## TenantSpec

| Field                                                                                               | CE  | EE  |
| --------------------------------------------------------------------------------------------------- | --- | --- |
| `loadBalancer.class`, `.disable`                                                                    | ✓   | ✓   |
| `loadBalancer.limit`                                                                                |     | ✓   |
| `ingress.class`, `.disable`                                                                         | ✓   | ✓   |
| `gatewayAPI.class`, `.disable`, `.defaultGateway`                                                   | ✓   | ✓   |
| `gatewayAPI.gatewaySettings.limit`                                                                  |     | ✓   |
| `gatewayAPI.disable{HTTP,gRPC,TCP,UDP,TLS}Route`                                                    |     | ✓   |
| `gatewayAPI.disable{Backend,Client}TrafficPolicy`                                                   |     | ✓   |
| `dns.wildcardDomain`, `.allowExplicitHostnames`, `.useDNSAnnotations`, `.useCertificateAnnotations` | ✓   | ✓   |
| `dns.disable`, `dns.allowedDomains`                                                                 |     | ✓   |
| `certificates.defaultClusterIssuer`                                                                 | ✓   | ✓   |
| `certificates.disable`, `certificates.allowedDomains`                                               |     | ✓   |
| `tunnel`                                                                                            |     | ✓   |
| `circuitBreaker`                                                                                    |     | ✓   |
| `allowedDomains` (top-level)                                                                        |     | ✓   |

## ConfigSpec

| Field                                                                        | CE  | EE  |
| ---------------------------------------------------------------------------- | --- | --- |
| `envoyProxy`, `loadBalancer`, `ingress`, `gatewayAPI`, `dns`, `certificates` | ✓   | ✓   |
| `propagatedAnnotations`, `propagateAllAnnotations`, `defaultAnnotations`     | ✓   | ✓   |
| `tunnel`                                                                     |     | ✓   |
| `circuitBreaker`                                                             |     | ✓   |
| `waf`                                                                        |     | ✓   |

## LoadBalancerSpec

| Field                                    | CE  | EE  |
| ---------------------------------------- | --- | --- |
| `endpoints`, `ports`, `hostname`, `type` | ✓   | ✓   |
| `externalTrafficPolicy`                  | ✓   | ✓   |

## EE-Only Resources

| Resource  | Notes                           |
| --------- | ------------------------------- |
| WAFPolicy | Full CRUD, `/waf-policies` page |
