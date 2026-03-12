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

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
