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

## Conventions

- `@/` path alias maps to `src/`
- File-based routing via TanStack Router (add routes in `src/routes/`)
- Query keys centralized in `src/api/query-keys.ts`
- Pre-commit hook runs lint-staged (ESLint + Prettier on staged files)
- CI runs lint, format check, type check, and build on all PRs
