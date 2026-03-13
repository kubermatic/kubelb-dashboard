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
├── mocks/                # MSW mock data (fixtures, handlers, store)
├── pages/                # Non-route page components
├── routes/               # TanStack Router file-based routes
├── stores/               # Zustand stores
├── types/                # Shared type definitions
├── main.tsx              # Entry point
└── index.css             # Tailwind import
```

## Mock Mode

`npm run dev:mock` starts the dashboard with MSW v2 intercepting `fetch()` in the browser. No cluster needed.

- Fixtures in `src/mocks/fixtures/` — live-captured data (18 resource types: tenants, configs, LBs, routes, secrets, WAF policies, envoy deployments, namespaces, gateways, GW routes, ingresses, services, EG policies)
- `npm run fixtures:capture` — re-capture fixtures from a live cluster (requires KUBECONFIG)
- In-memory CRUD via `MockStore` in `src/mocks/store.ts` — persists within session, resets on refresh
- Handlers in `src/mocks/handlers/` — one file per resource type, composed in `src/mocks/handlers.ts`
- Gated by `VITE_MOCK=true` env var — dynamic import ensures MSW is tree-shaken from prod builds
- Defaults to EE mode (WAF discovery returns 200)
- Watch not mocked — hooks fall back to polling via `refetchInterval`

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start dev server                     |
| `npm run dev:mock`     | Start with mock data (no cluster)    |
| `npm run build`        | Type check + build                   |
| `npm run preview`      | Preview production build             |
| `npm run lint`         | Run ESLint                           |
| `npm run lint:fix`     | Run ESLint with autofix              |
| `npm run format`       | Format with Prettier                 |
| `npm run format:check` | Check formatting                     |
| `npm run typecheck`    | Run TypeScript checker               |
| `npm run fixtures:capture` | Re-capture mock fixtures from live cluster |

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
- **Shared types** — `TenantSpec`/`ConfigSpec` in `src/types/kubelb.ts` have optional EE fields (tunnel, circuitBreaker, networkPolicy, loadBalancerPolicy, allowedDomains, waf). Undefined on CE.
- **Detail pages** — EE sections wrapped in `{isEE && <Section />}`.
- **EE-only pages** — WAF Policies (`/waf-policies`) with full CRUD.

## Conventions

- `@/` path alias maps to `src/`
- File-based routing via TanStack Router (add routes in `src/routes/`)
- Query keys centralized in `src/api/query-keys.ts`
- Pre-commit hook runs lint-staged (ESLint + Prettier on staged files)
- CI runs lint, format check, type check, and build on all PRs

## Discussion rules

For each task, query, question from my side please weigh out the pros and cons. If an action has significant downsides, please mention them and ask for confirmation before proceeding. If you are unsure about the best approach, outline the options and ask for guidance. Always prioritize correctness, security, and maintainability over speed.

## Commits, PR title and description rules

Use github template for PR description and populate fields that you think are required. Keep the description concise but informative.

For commits, always use meaningful signed commits and follow the conventional commit format. We don't want excessive commits that don't add value to the history. Each commit should represent a logical unit of work that can be easily understood and reviewed.
