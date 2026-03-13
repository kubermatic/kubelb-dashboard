# Notes

Things to fix/improve later.

## Resource Cross-References in Detail Views

LB detail view shows `ref: <name>` for endpoint `addressesReference` but doesn't resolve the actual values. Should fetch the referenced resource and display its data inline.

Broader problem: many KubeLB resources create/reference other K8s resources:

- **LoadBalancer** → creates a Service
- **Route (Ingress)** → creates an Ingress + multiple Services
- **Endpoints** → can reference Addresses resources

These referenced/created resources should be visible in the detail view — probably as cards showing their key fields (status, IPs, ports, etc.) rather than requiring the user to look them up separately.

## Replace Namespace with Tenant in List Views

LB, Route, SyncSecret list views show raw `namespace` (e.g. `tenant-shroud`). These resources only exist in tenant namespaces which always have the `tenant-` prefix.

Changes needed:

- Rename "Namespace" column → "Tenant" in all three list views
- Strip `tenant-` prefix for display (show `shroud` not `tenant-shroud`)
- Filter out any non-tenant namespaces (anything without `tenant-` prefix)
- Create a shared utility for this — already have `tenantToNamespace()` in `src/lib/format.ts`, need the inverse `namespaceToTenant()` and a filter helper
- Same pattern already used in the tenant dropdown selector

## RowActions Dropdown Flickering

The `...` (RowActions) dropdown in list views flickers on hover. Observed on Routes and possibly other views.

Investigation findings:

- `src/components/common/row-actions.tsx` uses base-ui `Menu.Trigger` with `render` prop composing a `Button`
- Previously had `<span>` wrappers around `DropdownMenuItem` which broke base-ui focus management → replaced with `React.Fragment` (commit on `fixes` branch)
- Fragment fix resolved the original hover flickering for menu items, but some flickering persists
- Dropdown itself **does** open correctly (verified via JS: `aria-expanded=true`, popup exists in DOM)
- `stopPropagation` on both the wrapper `<div>` (in each list view's column def) and the `Button` inside the trigger — may conflict with base-ui's internal event handling
- Possible root cause: base-ui's `Menu.Trigger` attaches pointer event handlers internally, and the `render` prop composition + `stopPropagation` on the Button may interfere with its open/close state management
- Worth trying: use `DropdownMenuTrigger` as parent (children composition) instead of `render` prop, or move `stopPropagation` entirely to the column cell wrapper and remove from Button

## API Server: Use `loadFromDefault()` for Kubeconfig Discovery

Current `kube-config.ts` manually branches between `loadFromFile()` (when `KUBECONFIG` env is set) and `loadFromCluster()` (fallback). This is fragile — in-cluster deployment returned `system:anonymous` errors.

`@kubernetes/client-node` has `loadFromDefault()` which mirrors the standard Go client-go discovery chain:

1. `$KUBECONFIG` env → load from file(s)
2. `~/.kube/config` → load from file
3. In-cluster SA token (`/var/run/secrets/kubernetes.io/serviceaccount/token`) → `loadFromCluster()`
4. Fallback to `localhost:8080`

Fix needed in `api/src/kube-config.ts` and `api/src/server.ts`:

- Replace manual `loadFromFile`/`loadFromCluster` branching with single `kc.loadFromDefault()` call
- Remove the `KUBECONFIG` env var check from `server.ts` — `loadFromDefault` handles it
- SA token rotation: currently token is read once at startup. In-cluster SA tokens rotate. Either re-read `/var/run/secrets/.../token` per request, or use the client-node's built-in request interceptors instead of manual proxy header injection
- RBAC is already configured correctly in `charts/kubelb-dashboard/templates/rbac.yaml` (ClusterRole with kubelb.k8c.io access, bound to dashboard SA)
- GHCR packages (`kubermatic/kubelb-dashboard`, `kubermatic/kubelb-dashboard-api`) are **private** — cluster needs a pull secret or packages must be made public

## Edit Dialog Slow Loading

All edit dialogs (observed on SyncSecret, likely all ResourceFormDialog/YamlEditorDialog instances) take too long to load with no spinner/loading indicator. Two issues:

1. CRD schema fetch via `useCRDSchema()` may be slow on first load — no loading state shown while waiting
2. No visual feedback (spinner/skeleton) in the dialog while content loads

## Wrong image naming convention

`sha-7e0ff5c` is how it looks like rightg now which is wrong. This should be the complete commit hash as is for example `7e0ff5c9b2a1c3d4e5f67890abcdef123456789`, not prefixed with `sha-`. This is because the image tag is used in the deployment manifest and it needs to match the actual image tag in the registry, which is the full commit hash without any prefix. The current naming convention with `sha-` will cause issues when trying to pull the image from the registry, as it won't match the expected tag format. This is how other projects in Kubermatic get the image tag from the commit hash. Please review for example, KKP public images.

## Improvements for docker image, security hardening but making pipelines good and fast

## What more do CI pipelines require for making sure we are doing everything right and it's all being tested

---

## TBD

### CI Not Triggering on Fork PRs

Org admin asked to enable fork PR workflows at kubermatic org level.

### Mock Fixture Staleness Detection via CRD Schema Diffing

Compare Go struct / OpenAPI schema from CRD against fixture JSON. CI script that:

```
CRD OpenAPI spec (source of truth) → diff against fixture JSON keys → report new/removed fields
```

API references are already generated from Go structs. A JSON schema validator can flag when fixtures are missing new required fields. Runs as a CI check, not Playwright — catches data-level drift before it reaches anyone.
