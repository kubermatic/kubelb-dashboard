#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KUBECONFIGS_DIR="${KUBECONFIGS_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)/.e2e-kubeconfigs}"

KUBELB_KUBECONFIG="${KUBECONFIGS_DIR}/kubelb.kubeconfig"
TENANT1_KUBECONFIG="${KUBECONFIGS_DIR}/tenant1.kubeconfig"
TENANT2_KUBECONFIG="${KUBECONFIGS_DIR}/tenant2.kubeconfig"

for kc in "$KUBELB_KUBECONFIG" "$TENANT1_KUBECONFIG" "$TENANT2_KUBECONFIG"; do
  if [[ ! -f "$kc" ]]; then
    echo "ERROR: kubeconfig not found: $kc"
    echo "Run 'make e2e-setup-kind && make e2e-deploy' first or set KUBECONFIGS_DIR"
    exit 1
  fi
done

echo "==> Applying Tenants and WAFPolicies to management cluster..."
kubectl --kubeconfig="$KUBELB_KUBECONFIG" apply -f "$SCRIPT_DIR/management.yaml"

echo "==> Applying tenant1 resources (Services, Ingresses, HTTPRoutes, Secrets)..."
kubectl --kubeconfig="$TENANT1_KUBECONFIG" apply -f "$SCRIPT_DIR/tenant1.yaml"

echo "==> Applying tenant2 resources..."
kubectl --kubeconfig="$TENANT2_KUBECONFIG" apply -f "$SCRIPT_DIR/tenant2.yaml"

echo ""
echo "==> Waiting for CCM to propagate resources to management cluster..."
for i in $(seq 1 30); do
  LB_COUNT=$(kubectl --kubeconfig="$KUBELB_KUBECONFIG" get loadbalancers.kubelb.k8c.io -A --no-headers 2>/dev/null | wc -l | tr -d ' ')
  ROUTE_COUNT=$(kubectl --kubeconfig="$KUBELB_KUBECONFIG" get routes.kubelb.k8c.io -A --no-headers 2>/dev/null | wc -l | tr -d ' ')
  # tenant1: 2 LBs, tenant2: 1 LB (+ baseline echo-shared-lb per tenant)
  # tenant1: 2 Ingresses + 1 HTTPRoute + 1 GRPCRoute + 1 TCPRoute + 1 UDPRoute + 1 TLSRoute = 7 Routes
  # tenant2: 1 Ingress + 1 HTTPRoute = 2 Routes
  if [[ "$LB_COUNT" -ge 3 ]] && [[ "$ROUTE_COUNT" -ge 5 ]]; then
    echo "    Propagation detected: ${LB_COUNT} LoadBalancers, ${ROUTE_COUNT} Routes"
    break
  fi
  printf "    Waiting... (${i}/30) LBs: %s, Routes: %s\r" "$LB_COUNT" "$ROUTE_COUNT"
  sleep 2
done

echo ""
echo "=== Management Cluster ==="
echo ""
echo "Tenants:"
kubectl --kubeconfig="$KUBELB_KUBECONFIG" get tenants.kubelb.k8c.io 2>/dev/null || true
echo ""
echo "LoadBalancers (auto-created by CCM from tenant Services):"
kubectl --kubeconfig="$KUBELB_KUBECONFIG" get loadbalancers.kubelb.k8c.io -A --show-labels 2>/dev/null || true
echo ""
echo "Routes (auto-created by CCM from tenant Ingresses/HTTPRoutes):"
kubectl --kubeconfig="$KUBELB_KUBECONFIG" get routes.kubelb.k8c.io -A --show-labels 2>/dev/null || true
echo ""
echo "SyncSecrets (auto-created by CCM from labeled tenant Secrets):"
kubectl --kubeconfig="$KUBELB_KUBECONFIG" get syncsecrets.kubelb.k8c.io -A 2>/dev/null || true
echo ""
echo "WAFPolicies:"
kubectl --kubeconfig="$KUBELB_KUBECONFIG" get wafpolicies.kubelb.k8c.io 2>/dev/null || true
echo ""
echo "Done."
