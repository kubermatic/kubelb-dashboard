# KubeLB Dashboard

Web dashboard for [KubeLB](https://docs.kubermatic.com/kubelb/) — a cloud-native multi-tenant load balancer solution.

## Development

Prerequisites: Node.js 22+, a kubeconfig for KubeLB Management cluster.

```bash
export KUBECONFIG=/path/to/your/kubeconfig
npm install
npm run dev
```

This starts the frontend (Vite on `:5173`) and the API proxy (Fastify on `:3001`) concurrently. The Vite dev server proxies `/api/` requests to the API server.

### Mock Mode (no cluster required)

```bash
npm run dev:mock
```

Uses [MSW v2](https://mswjs.io/) to intercept `fetch()` in the browser with realistic mock data captured from a live cluster. CRUD mutations persist within the browser session; page refresh resets to seed data. Runs in EE mode (WAF policies visible). MSW is tree-shaken from production builds.

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
