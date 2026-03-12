# KubeLB Dashboard

Web dashboard for KubeLB — a cloud-native multi-tenant load balancer solution.

## Tech Stack

| Layer        | Choice              | Version |
| ------------ | ------------------- | ------- |
| Framework    | React               | 19      |
| Language     | TypeScript (strict) | 5.9     |
| Build        | Vite                | 7       |
| Styling      | Tailwind CSS        | 4       |
| Components   | shadcn/ui           | —       |
| Server State | TanStack Query      | 5       |
| Client State | Zustand             | 5       |
| Routing      | TanStack Router     | 1       |
| Linting      | ESLint (flat)       | 9       |
| Formatting   | Prettier            | 3       |
| Git Hooks    | husky + lint-staged | —       |
| CI           | GitHub Actions      | —       |

## Project Structure

```
src/
├── api/                  # API client, query keys
├── components/
│   ├── layout/           # Shell, sidebar, header
│   ├── ui/               # shadcn/ui components
│   └── common/           # Shared app components
├── hooks/                # Custom hooks
├── lib/                  # Utilities (cn, etc.)
├── pages/                # Non-route page components
├── routes/               # TanStack Router file-based routes
├── stores/               # Zustand stores
├── types/                # Shared type definitions
├── main.tsx              # Entry point
└── index.css             # Tailwind import
```

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run dev`          | Start dev server         |
| `npm run build`        | Type check + build       |
| `npm run preview`      | Preview production build |
| `npm run lint`         | Run ESLint               |
| `npm run lint:fix`     | Run ESLint with autofix  |
| `npm run format`       | Format with Prettier     |
| `npm run format:check` | Check formatting         |
| `npm run typecheck`    | Run TypeScript checker   |

## Adding shadcn/ui Components

```bash
npx shadcn@latest init
npx shadcn@latest add button
```

## CE/EE Edition Split

Single repo, single build. Edition auto-detected at runtime via CRD discovery:

```
GET /api/kube/apis/kubelb.k8c.io/v1alpha1/wafpolicies → 200=EE, 404=CE
```

- **`useEdition()` hook** (`src/hooks/use-edition.ts`) — returns `{ edition, isEE, loading }`. Cached forever (`staleTime: Infinity`). Edition can't change during pod lifetime.
- **Sidebar** — `NavItem.ee?: boolean` flag. Items with `ee: true` hidden on CE.
- **Shared types** — `TenantSpec`/`ConfigSpec` in `src/types/kubelb.ts` have optional EE fields. Undefined on CE.
- **Detail pages** — EE fields/sections MUST be wrapped in `{isEE && <Section />}`.
- **EE-only pages** — WAF Policies (`/waf-policies`) with full CRUD.

### CE/EE Field Reference

**Source of truth:** Go API types at `~/go/src/k8c.io/kubelb-ee/api/{ce,ee}/kubelb.k8c.io/v1alpha1/`

When adding or displaying resource fields, ALWAYS check whether the field exists in the CE types. EE-only fields MUST be gated with `{isEE && ...}` in JSX. The TypeScript types in `src/types/kubelb.ts` include both CE and EE fields (EE fields are optional `?`).

#### TenantSpec

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
| `networkPolicy`                                                                                     |     | ✓   |
| `loadBalancerPolicy`                                                                                |     | ✓   |
| `allowedDomains` (top-level)                                                                        |     | ✓   |

#### ConfigSpec

| Field                                                                        | CE  | EE  |
| ---------------------------------------------------------------------------- | --- | --- |
| `envoyProxy`, `loadBalancer`, `ingress`, `gatewayAPI`, `dns`, `certificates` | ✓   | ✓   |
| `propagatedAnnotations`, `propagateAllAnnotations`, `defaultAnnotations`     | ✓   | ✓   |
| `tunnel`                                                                     |     | ✓   |
| `circuitBreaker`                                                             |     | ✓   |
| `loadBalancerPolicy`                                                         |     | ✓   |
| `waf`                                                                        |     | ✓   |
| `networkPolicy`                                                              |     | ✓   |

#### EE-Only Resources

| Resource  | Notes                           |
| --------- | ------------------------------- |
| WAFPolicy | Full CRUD, `/waf-policies` page |

## Conventions

- `@/` path alias maps to `src/`
- File-based routing via TanStack Router (add routes in `src/routes/`)
- Query keys centralized in `src/api/query-keys.ts`
- Pre-commit hook runs lint-staged (ESLint + Prettier on staged files)
- CI runs lint, format check, type check, and build on all PRs

## Discussion rules

For each task, query, question from my side please weigh out the pros and cons. If an action has significant downsides, please mention them and ask for confirmation before proceeding. If you are unsure about the best approach, outline the options and ask for guidance. Always prioritize correctness, security, and maintainability over speed.
