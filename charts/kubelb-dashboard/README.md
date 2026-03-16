# kubelb-dashboard

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.1.0](https://img.shields.io/badge/AppVersion-0.1.0-informational?style=flat-square)

## Install

```bash
helm upgrade kubelb-dashboard oci://quay.io/kubermatic/helm-charts/kubelb-dashboard --version 0.1.0 --namespace kubelb --create-namespace --install
```

## Example with Ingress

```bash
helm install kubelb-dashboard oci://quay.io/kubermatic/helm-charts/kubelb-dashboard \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set ingress.hosts[0].host=app.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

## Security

The chart runs with a hardened security context by default:

- Non-root user (uid 101, nginx)
- Read-only root filesystem
- All capabilities dropped
- Seccomp RuntimeDefault profile
- emptyDir volumes for nginx writable paths (`/tmp`, `/var/cache/nginx`, `/var/run`)

## Values

| Key                                        | Type   | Default                                                                       | Description                                                                                             |
| ------------------------------------------ | ------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| affinity                                   | object | `{}`                                                                          | Affinity rules                                                                                          |
| api.image.pullPolicy                       | string | `"IfNotPresent"`                                                              | Image pull policy                                                                                       |
| api.image.repository                       | string | `"quay.io/kubermatic/kubelb-dashboard-api"`                                   | API server image repository                                                                             |
| api.image.tag                              | string | `""`                                                                          | Image tag (defaults to chart appVersion)                                                                |
| api.resources                              | object | `{}`                                                                          | API server CPU/memory resource requests and limits                                                      |
| auth.enabled                               | bool   | `false`                                                                       | Enable OIDC authentication                                                                              |
| auth.existingSecret                        | string | `""`                                                                          | Use existing Secret for clientSecret and sessionSecret keys                                             |
| auth.oidc.clientId                         | string | `""`                                                                          | OIDC client ID                                                                                          |
| auth.oidc.clientSecret                     | string | `""`                                                                          | OIDC client secret (ignored if existingSecret is set)                                                   |
| auth.oidc.issuerUrl                        | string | `""`                                                                          | OIDC provider issuer URL (e.g. https://dex.example.com)                                                 |
| auth.oidc.redirectUri                      | string | `""`                                                                          | Override redirect URI (auto-derived from ingress if empty)                                              |
| auth.oidc.scopes                           | string | `"openid email profile groups offline_access"`                                | Space-separated OIDC scopes                                                                             |
| auth.session.maxAge                        | int    | `86400`                                                                       | Session cookie max age in seconds                                                                       |
| auth.session.secret                        | string | `""`                                                                          | Session cookie encryption secret, 32+ chars (auto-generated if empty, ignored if existingSecret is set) |
| autoscaling.enabled                        | bool   | `false`                                                                       | Enable horizontal pod autoscaler                                                                        |
| autoscaling.maxReplicas                    | int    | `5`                                                                           | Maximum replicas                                                                                        |
| autoscaling.minReplicas                    | int    | `1`                                                                           | Minimum replicas                                                                                        |
| autoscaling.targetCPUUtilizationPercentage | int    | `80`                                                                          | Target CPU utilization percentage                                                                       |
| fullnameOverride                           | string | `""`                                                                          | Override full release name                                                                              |
| image.pullPolicy                           | string | `"IfNotPresent"`                                                              | Image pull policy                                                                                       |
| image.repository                           | string | `"quay.io/kubermatic/kubelb-dashboard"`                                       | Dashboard (nginx) image repository                                                                      |
| image.tag                                  | string | `""`                                                                          | Image tag (defaults to chart appVersion)                                                                |
| imagePullSecrets                           | list   | `[]`                                                                          | Image pull secrets                                                                                      |
| ingress.annotations                        | object | `{}`                                                                          | Ingress annotations                                                                                     |
| ingress.className                          | string | `""`                                                                          | Ingress class name                                                                                      |
| ingress.enabled                            | bool   | `false`                                                                       | Enable ingress                                                                                          |
| ingress.hosts                              | list   | `[{"host":"chart-example.local","paths":[{"path":"/","pathType":"Prefix"}]}]` | Ingress hosts                                                                                           |
| ingress.tls                                | list   | `[]`                                                                          | Ingress TLS configuration                                                                               |
| kubeconfig.existingSecret                  | string | `""`                                                                          | Existing Secret containing a kubeconfig file (for out-of-cluster access)                                |
| kubeconfig.key                             | string | `"kubeconfig"`                                                                | Key inside the Secret that holds the kubeconfig file                                                    |
| nameOverride                               | string | `""`                                                                          | Override release name                                                                                   |
| nodeSelector                               | object | `{}`                                                                          | Node selector                                                                                           |
| podAnnotations                             | object | `{}`                                                                          | Pod annotations                                                                                         |
| podLabels                                  | object | `{}`                                                                          | Pod labels                                                                                              |
| podSecurityContext.fsGroup                 | int    | `101`                                                                         | Filesystem group                                                                                        |
| podSecurityContext.runAsGroup              | int    | `101`                                                                         | Group ID                                                                                                |
| podSecurityContext.runAsNonRoot            | bool   | `true`                                                                        | Run as non-root user                                                                                    |
| podSecurityContext.runAsUser               | int    | `101`                                                                         | User ID (101 = nginx)                                                                                   |
| podSecurityContext.seccompProfile.type     | string | `"RuntimeDefault"`                                                            | Seccomp profile type                                                                                    |
| rbac.create                                | bool   | `true`                                                                        | Create RBAC resources (ClusterRole + ClusterRoleBinding)                                                |
| replicaCount                               | int    | `1`                                                                           | Number of replicas                                                                                      |
| resources                                  | object | `{}`                                                                          | Dashboard (nginx) CPU/memory resource requests and limits                                               |
| securityContext.allowPrivilegeEscalation   | bool   | `false`                                                                       | Disallow privilege escalation                                                                           |
| securityContext.capabilities.drop          | list   | `["ALL"]`                                                                     | Drop all capabilities                                                                                   |
| securityContext.readOnlyRootFilesystem     | bool   | `true`                                                                        | Read-only root filesystem                                                                               |
| service.port                               | int    | `80`                                                                          | Service port                                                                                            |
| service.type                               | string | `"ClusterIP"`                                                                 | Service type                                                                                            |
| serviceAccount.annotations                 | object | `{}`                                                                          | Service account annotations                                                                             |
| serviceAccount.automount                   | bool   | `true`                                                                        | Automount service account token                                                                         |
| serviceAccount.create                      | bool   | `true`                                                                        | Create a service account                                                                                |
| serviceAccount.name                        | string | `""`                                                                          | Service account name (generated if empty)                                                               |
| tolerations                                | list   | `[]`                                                                          | Tolerations                                                                                             |

## Maintainers

| Name       | Email                    | Url                      |
| ---------- | ------------------------ | ------------------------ |
| Kubermatic | <support@kubermatic.com> | <https://kubermatic.com> |
