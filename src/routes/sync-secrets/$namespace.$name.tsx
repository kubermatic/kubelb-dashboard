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
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSyncSecret } from "@/hooks/use-sync-secrets";
import type { SyncSecret } from "@/types/kubelb";

export const Route = createFileRoute("/sync-secrets/$namespace/$name")({
  component: SyncSecretDetail,
});

function SyncSecretDetail() {
  const { namespace, name } = Route.useParams();
  const { data: secret, isLoading, error, refetch } = useSyncSecret(namespace, name);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    if (error instanceof KubeApiError && error.code === 404) {
      return (
        <ResourceNotFound
          resourceKind="Sync Secret"
          backHref="/sync-secrets"
          backLabel="Sync Secrets"
        />
      );
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!secret) return null;

  return (
    <div className="space-y-6">
      <ResourceHeader
        name={secret.metadata.name}
        namespace={secret.metadata.namespace}
        kind="SyncSecret"
        createdAt={secret.metadata.creationTimestamp}
        backHref="/sync-secrets"
        backLabel="Sync Secrets"
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab secret={secret} />
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <DataTab secret={secret} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSection metadata={secret.metadata} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ secret }: { secret: SyncSecret }) {
  const annotations = secret.metadata.annotations ?? {};
  const originNs = annotations["kubelb.k8c.io/origin-namespace"] ?? "\u2014";
  const originName = annotations["kubelb.k8c.io/origin-name"] ?? "\u2014";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Secret Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Type</span>
            <span>{secret.type ?? "\u2014"}</span>
            <span className="text-muted-foreground">Immutable</span>
            <Badge
              variant="outline"
              className={
                secret.immutable ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
              }
            >
              {secret.immutable ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source Secret</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Origin Namespace</span>
            <span>{originNs}</span>
            <span className="text-muted-foreground">Origin Name</span>
            <span>{originName}</span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function DataTab({ secret }: { secret: SyncSecret }) {
  const dataKeys = Object.keys(secret.data ?? {});
  const stringDataKeys = Object.keys(secret.stringData ?? {});

  if (dataKeys.length === 0 && stringDataKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No data keys present.</p>;
  }

  return (
    <>
      {dataKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataKeys.map((key) => (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs">{key}</TableCell>
                      <TableCell className="text-xs">
                        {secret.data?.[key]?.length ?? 0} bytes
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {stringDataKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>String Data Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stringDataKeys.map((key) => (
                    <TableRow key={key}>
                      <TableCell className="font-mono text-xs">{key}</TableCell>
                      <TableCell className="text-xs">
                        {secret.stringData?.[key]?.length ?? 0} bytes
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
