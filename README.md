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

## Authentication

OIDC authentication is optional. Set all four env vars to enable:

| Variable             | Required | Default                                      | Description                                               |
| -------------------- | -------- | -------------------------------------------- | --------------------------------------------------------- |
| `OIDC_ISSUER`        | Yes\*    | —                                            | OIDC provider issuer URL (e.g. `https://dex.example.com`) |
| `OIDC_CLIENT_ID`     | Yes\*    | —                                            | OIDC client ID                                            |
| `OIDC_CLIENT_SECRET` | Yes\*    | —                                            | OIDC client secret                                        |
| `SESSION_SECRET`     | Yes\*    | —                                            | 32+ char secret for encrypting session cookies            |
| `OIDC_REDIRECT_URI`  | No       | `http://localhost:{PORT}/auth/callback`      | Callback URL registered with IdP                          |
| `OIDC_SCOPES`        | No       | `openid email profile groups offline_access` | Space-separated scopes                                    |
| `SESSION_MAX_AGE`    | No       | `86400` (24h)                                | Session cookie max age in seconds                         |

\*All four must be set together. Partial config exits with an error. If none are set, the dashboard runs without authentication.

## License

Apache License 2.0 — see [LICENSE](LICENSE) for details.
