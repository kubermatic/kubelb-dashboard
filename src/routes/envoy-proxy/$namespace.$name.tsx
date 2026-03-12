/*
 * Copyright 2026 The KubeLB Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { createFileRoute } from "@tanstack/react-router";

import { KubeApiError } from "@/api/kube";
import { ConditionsTable } from "@/components/common/conditions-table";
import { KeyValuePairs } from "@/components/common/key-value-pairs";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeployment } from "@/hooks/use-deployments";

export const Route = createFileRoute("/envoy-proxy/$namespace/$name")({
  component: EnvoyProxyDetail,
});

function EnvoyProxyDetail() {
  const { namespace, name } = Route.useParams();
  const { data: deployment, isLoading, isError, error, refetch } = useDeployment(namespace, name);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError && error) {
    if (error instanceof KubeApiError && error.code === 404) {
      return (
        <ResourceNotFound
          resourceKind="Envoy Proxy"
          backHref="/envoy-proxy"
          backLabel="Envoy Proxies"
        />
      );
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!deployment) return null;

  return (
    <div className="space-y-6">
      <ResourceHeader
        name={deployment.metadata.name}
        namespace={deployment.metadata.namespace}
        kind="Deployment"
        createdAt={deployment.metadata.creationTimestamp}
        backHref="/envoy-proxy"
        backLabel="Envoy Proxies"
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Replicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Desired</span>
                    <p className="text-lg font-semibold">{deployment.spec.replicas ?? "\u2014"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ready</span>
                    <p className="text-lg font-semibold">{deployment.status?.readyReplicas ?? 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Available</span>
                    <p className="text-lg font-semibold">
                      {deployment.status?.availableReplicas ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selector</CardTitle>
              </CardHeader>
              <CardContent>
                <KeyValuePairs
                  data={deployment.spec.selector?.matchLabels}
                  emptyMessage="No selector labels"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ConditionsTable conditions={deployment.status?.conditions ?? []} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metadata">
          <div className="pt-4">
            <MetadataSection metadata={deployment.metadata} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
