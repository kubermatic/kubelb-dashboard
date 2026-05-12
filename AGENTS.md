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
npm run setup    # dashboard + api deps + git hooks
npm run dev
```

> The repo `.npmrc` sets `ignore-scripts=true` to block postinstall script execution as a supply-chain hardening measure, so the `prepare` lifecycle that normally installs husky hooks is skipped. `npm run setup` runs root install, api install, and `npx husky` in one step. If you ever pull a dep that genuinely needs its install script, run `npm rebuild <pkg>` explicitly.

## Scripts

| Command                    | Description                                |
| -------------------------- | ------------------------------------------ |
| `npm run dev`              | Start dev server                           |
| `npm run dev:mock`         | Start with mock data (no cluster)          |
| `npm run build`            | Type check + build                         |
| `npm run preview`          | Preview production build                   |
| `npm run lint`             | Run ESLint                                 |
| `npm run lint:fix`         | Run ESLint with autofix                    |
| `npm run format`           | Format with Prettier                       |
| `npm run format:check`     | Check formatting                           |
| `npm run typecheck`        | Run TypeScript checker                     |
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
- **Shared types** — `TenantSpec`/`ConfigSpec` in `src/types/kubelb.ts` have optional EE fields. Undefined on CE.
- **Detail pages** — EE fields/sections MUST be wrapped in `{isEE && <Section />}`.
- **EE-only pages** — WAF Policies (`/waf-policies`) with full CRUD.

### CE/EE Field Reference

See [`docs/ce-ee-fields.md`](docs/ce-ee-fields.md) for the full per-resource CE/EE field tables. **Always** consult that file before adding or displaying resource fields — EE-only fields MUST be gated with `{isEE && ...}` in JSX. Update that file when adding new fields.

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

## Design Context

### Users

Mixed technical audience — platform engineers managing KubeLB infrastructure and app developers needing visibility into their load balancer configs. Users are Kubernetes-literate but vary in depth. They need fast orientation, clear status, and efficient management workflows.

### Brand Personality

**Modern, clean, efficient.** A contemporary developer tool that respects the user's time and technical competence. No unnecessary decoration — every element earns its place.

### Aesthetic Direction

- **Primary references:** Kubermatic KKP dashboard (brand consistency), Linear/Vercel (polish, minimalism, strong typography)
- **Anti-references:** Cluttered enterprise dashboards with excessive chrome, gratuitous animations, or infantilizing UX
- **Theme:** Dark sidebar (#1b2530) with cyan accent (#3db8e5), light/dark mode parity. Navy primary (#004066 light, #3db8e5 dark). IBM Plex Sans family throughout. Tight border radius (4px base) for sharp, modern feel.
- **Visual tone:** Information-dense but not overwhelming. Generous whitespace. Clear visual hierarchy via typography weight and color, not borders or boxes.

### Design Principles

1. **Clarity over decoration** — Every pixel communicates. No ornamental elements. Status, hierarchy, and actions must be instantly scannable.
2. **Density with breathing room** — Show what matters without scrolling, but don't crowd. Tables, stats, and nav should feel spacious despite high information density.
3. **Consistent vocabulary** — Same colors, spacing, and patterns for the same concepts everywhere. Success is always teal, destructive is always red, primary actions are always navy/cyan.
4. **Keyboard-first, mouse-friendly** — Command palette, focus rings, logical tab order. Power users shouldn't need a mouse; casual users shouldn't need a keyboard.
5. **Quiet confidence** — Subtle transitions (200-300ms), no bouncing or attention-grabbing animation. The interface should feel solid and trustworthy, like well-maintained infrastructure.

### Accessibility

- WCAG AA compliance (contrast ratios, keyboard navigation, screen reader support)
- Focus-visible rings on all interactive elements (3px ring, 50% opacity)
- Reduced motion support via `prefers-reduced-motion`
- Status communicated through shape/text in addition to color (badge dots + labels)
