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

import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import yaml from "js-yaml";
import { FileCode } from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceFormDialog } from "@/components/common/resource-form-dialog";
import { ResourceHeader } from "@/components/common/resource-header";
import { YamlEditorDialog } from "@/components/common/yaml-editor-dialog";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useCRDSchema } from "@/hooks/use-crd-schema";
import { useDeleteSyncSecret, useUpdateSyncSecret } from "@/hooks/use-sync-secret-mutations";
import { useSyncSecret } from "@/hooks/use-sync-secrets";
import { sanitizeForEdit } from "@/lib/kube-sanitize";
import { EDITING_ENABLED, YAML_EDITOR_ENABLED } from "@/lib/feature-flags";
import { buildUiSchema } from "@/lib/kube-ui-schema";
import type { SyncSecret } from "@/types/kubelb";

const RESOURCE_KIND = "SyncSecret";
const API_VERSION = "kubelb.k8c.io/v1alpha1";
const CRD_NAME = "syncsecrets.kubelb.k8c.io";

export const Route = createFileRoute("/sync-secrets/$namespace/$name")({
  component: SyncSecretDetail,
});

function SyncSecretDetail() {
  const { namespace, name } = Route.useParams();
  const navigate = useNavigate();
  const { data: secret, isLoading, error, refetch } = useSyncSecret(namespace, name);
  const { data: crdSchema } = useCRDSchema(CRD_NAME, "v1alpha1");
  const updateSyncSecret = useUpdateSyncSecret();
  const deleteSyncSecret = useDeleteSyncSecret();
  const editUiSchema = useMemo(() => buildUiSchema(RESOURCE_KIND, "edit"), []);

  const [yamlOpen, setYamlOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const editYaml = yaml.dump(sanitizeForEdit(secret), { noRefs: true, lineWidth: -1 });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <ResourceHeader
          name={secret.metadata.name}
          namespace={secret.metadata.namespace}
          kind="SyncSecret"
          createdAt={secret.metadata.creationTimestamp}
          backHref="/sync-secrets"
          backLabel="Sync Secrets"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYamlOpen(true)}>
            <FileCode />
            View YAML
          </Button>
          {EDITING_ENABLED && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

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

      <YamlViewer
        open={yamlOpen}
        onOpenChange={setYamlOpen}
        resource={secret}
        title={`SyncSecret: ${namespace}/${name}`}
      />

      {EDITING_ENABLED &&
        (crdSchema ? (
          <ResourceFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            title="Edit SyncSecret"
            schema={crdSchema}
            uiSchema={editUiSchema}
            formData={sanitizeForEdit(secret) as Record<string, unknown>}
            isPending={updateSyncSecret.isPending}
            onSubmit={(parsed) => {
              void updateSyncSecret
                .mutateAsync(parsed as SyncSecret)
                .then(() => setEditOpen(false));
            }}
          />
        ) : YAML_EDITOR_ENABLED ? (
          <YamlEditorDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            mode="edit"
            title="Edit SyncSecret"
            resourceKind={RESOURCE_KIND}
            apiVersion={API_VERSION}
            initialYaml={editYaml}
            lockedFields={{ name: true }}
            isPending={updateSyncSecret.isPending}
            onSubmit={(parsed) => {
              void updateSyncSecret
                .mutateAsync(parsed as SyncSecret)
                .then(() => setEditOpen(false));
            }}
          />
        ) : null)}

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        resourceName={name}
        resourceKind="SyncSecret"
        isPending={deleteSyncSecret.isPending}
        onConfirm={() => {
          void deleteSyncSecret.mutateAsync({ namespace, name }).then(() => {
            setDeleteOpen(false);
            void navigate({
              to: "/sync-secrets",
              search: { search: "", page: 0, pageSize: 10 },
            });
          });
        }}
      />
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
