# kubelb-dashboard

![Version: 0.1.0](https://img.shields.io/badge/Version-0.1.0-informational?style=flat-square) ![Type: application](https://img.shields.io/badge/Type-application-informational?style=flat-square) ![AppVersion: 0.1.0](https://img.shields.io/badge/AppVersion-0.1.0-informational?style=flat-square)

## Install

```bash
helm install kubelb-dashboard oci://ghcr.io/kubermatic/charts/kubelb-dashboard --version 0.1.0
```

## Example with Ingress

```bash
helm install kubelb-dashboard oci://ghcr.io/kubermatic/charts/kubelb-dashboard \
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

| Key                                        | Type   | Default                                                                       | Description                               |
| ------------------------------------------ | ------ | ----------------------------------------------------------------------------- | ----------------------------------------- |
| affinity                                   | object | `{}`                                                                          | Affinity rules                            |
| autoscaling.enabled                        | bool   | `false`                                                                       | Enable horizontal pod autoscaler          |
| autoscaling.maxReplicas                    | int    | `5`                                                                           | Maximum replicas                          |
| autoscaling.minReplicas                    | int    | `1`                                                                           | Minimum replicas                          |
| autoscaling.targetCPUUtilizationPercentage | int    | `80`                                                                          | Target CPU utilization percentage         |
| fullnameOverride                           | string | `""`                                                                          | Override full release name                |
| image.pullPolicy                           | string | `"IfNotPresent"`                                                              | Image pull policy                         |
| image.repository                           | string | `"ghcr.io/kubermatic/kubelb-dashboard"`                                       | Container image repository                |
| image.tag                                  | string | `""`                                                                          | Image tag (defaults to chart appVersion)  |
| imagePullSecrets                           | list   | `[]`                                                                          | Image pull secrets                        |
| ingress.annotations                        | object | `{}`                                                                          | Ingress annotations                       |
| ingress.className                          | string | `""`                                                                          | Ingress class name                        |
| ingress.enabled                            | bool   | `false`                                                                       | Enable ingress                            |
| ingress.hosts                              | list   | `[{"host":"chart-example.local","paths":[{"path":"/","pathType":"Prefix"}]}]` | Ingress hosts                             |
| ingress.tls                                | list   | `[]`                                                                          | Ingress TLS configuration                 |
| nameOverride                               | string | `""`                                                                          | Override release name                     |
| nodeSelector                               | object | `{}`                                                                          | Node selector                             |
| podAnnotations                             | object | `{}`                                                                          | Pod annotations                           |
| podLabels                                  | object | `{}`                                                                          | Pod labels                                |
| podSecurityContext.fsGroup                 | int    | `101`                                                                         | Filesystem group                          |
| podSecurityContext.runAsGroup              | int    | `101`                                                                         | Group ID                                  |
| podSecurityContext.runAsNonRoot            | bool   | `true`                                                                        | Run as non-root user                      |
| podSecurityContext.runAsUser               | int    | `101`                                                                         | User ID (101 = nginx)                     |
| podSecurityContext.seccompProfile.type     | string | `"RuntimeDefault"`                                                            | Seccomp profile type                      |
| replicaCount                               | int    | `1`                                                                           | Number of replicas                        |
| resources                                  | object | `{}`                                                                          | CPU/memory resource requests and limits   |
| securityContext.allowPrivilegeEscalation   | bool   | `false`                                                                       | Disallow privilege escalation             |
| securityContext.capabilities.drop          | list   | `["ALL"]`                                                                     | Drop all capabilities                     |
| securityContext.readOnlyRootFilesystem     | bool   | `true`                                                                        | Read-only root filesystem                 |
| service.port                               | int    | `80`                                                                          | Service port                              |
| service.type                               | string | `"ClusterIP"`                                                                 | Service type                              |
| serviceAccount.annotations                 | object | `{}`                                                                          | Service account annotations               |
| serviceAccount.automount                   | bool   | `true`                                                                        | Automount service account token           |
| serviceAccount.create                      | bool   | `true`                                                                        | Create a service account                  |
| serviceAccount.name                        | string | `""`                                                                          | Service account name (generated if empty) |
| tolerations                                | list   | `[]`                                                                          | Tolerations                               |

## Maintainers

| Name               | Email | Url                                              |
| ------------------ | ----- | ------------------------------------------------ |
| The KubeLB Authors |       | <https://github.com/kubermatic/kubelb-dashboard> |
