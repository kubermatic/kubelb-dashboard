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

import { useState } from "react";
import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { FileCode, Pencil, Trash2 } from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { ConditionsTable } from "@/components/common/conditions-table";
import { DeleteDialog } from "@/components/common/delete-dialog";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { WAFPolicyFormDialog } from "@/components/common/waf-policy-form-dialog";
import { ResourceHeader } from "@/components/common/resource-header";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailSkeleton } from "@/components/common/detail-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteWAFPolicy, useUpdateWAFPolicy } from "@/hooks/use-waf-policy-mutations";
import { useReadOnly } from "@/hooks/use-read-only";
import { useWAFPolicy } from "@/hooks/use-waf-policies";
import type { WAFPolicy } from "@/types/kubelb";

export const Route = createLazyFileRoute("/waf-policies/$name")({
  component: WAFPolicyDetail,
});

function WAFPolicyDetail() {
  const { name } = Route.useParams();
  const navigate = useNavigate();
  const { data: policy, isLoading, error, refetch } = useWAFPolicy(name);
  const updateWAFPolicy = useUpdateWAFPolicy();
  const deleteWAFPolicy = useDeleteWAFPolicy();
  const readOnly = useReadOnly();

  const [yamlViewerOpen, setYamlViewerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error) {
    if (error instanceof KubeApiError && error.code === 404) {
      return (
        <ResourceNotFound
          resourceKind="WAFPolicy"
          backHref="/waf-policies"
          backLabel="WAF Policies"
        />
      );
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!policy) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <ResourceHeader
          name={policy.metadata.name}
          namespace={policy.metadata.namespace}
          kind="WAFPolicy"
          createdAt={policy.metadata.creationTimestamp}
          backHref="/waf-policies"
          backLabel="WAF Policies"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYamlViewerOpen(true)}>
            <FileCode />
            View YAML
          </Button>
          {!readOnly && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab policy={policy} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSection metadata={policy.metadata} />
        </TabsContent>
      </Tabs>

      <YamlViewer
        open={yamlViewerOpen}
        onOpenChange={setYamlViewerOpen}
        resource={policy}
        title={`WAF Policy: ${name}`}
      />

      <WAFPolicyFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        title={`Edit WAF Policy: ${name}`}
        policy={policy}
        isPending={updateWAFPolicy.isPending}
        onSubmit={(parsed) => {
          void updateWAFPolicy.mutateAsync(parsed).then(() => setEditOpen(false));
        }}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        resourceName={name}
        resourceKind="WAFPolicy"
        isPending={deleteWAFPolicy.isPending}
        onConfirm={() => {
          void deleteWAFPolicy
            .mutateAsync(name)
            .then(() =>
              navigate({ to: "/waf-policies", search: { search: "", page: 0, pageSize: 10 } }),
            );
        }}
      />
    </div>
  );
}

function OverviewTab({ policy }: { policy: WAFPolicy }) {
  const { spec, status } = policy;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Targeting</CardTitle>
        </CardHeader>
        <CardContent>
          {spec.global ? (
            <Badge className="bg-success/10 text-success" variant="outline">
              Global
            </Badge>
          ) : spec.targetRef ? (
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Group</span>
              <span>{spec.targetRef.group ?? "\u2014"}</span>
              <span className="text-muted-foreground">Kind</span>
              <span>{spec.targetRef.kind}</span>
              <span className="text-muted-foreground">Namespace</span>
              <span>{spec.targetRef.namespace ?? "\u2014"}</span>
              <span className="text-muted-foreground">Name</span>
              <span>{spec.targetRef.name}</span>
            </div>
          ) : spec.targetSelector ? (
            <div className="space-y-2 text-sm">
              <span className="text-muted-foreground">Label Selector</span>
              <pre className="rounded-md bg-muted p-3 font-mono text-xs">
                {JSON.stringify(spec.targetSelector, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No targeting configured</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">Failure Mode</span>
            <Badge variant="outline">{spec.failureMode ?? "Closed"}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Directives</CardTitle>
        </CardHeader>
        <CardContent>
          {spec.directives && spec.directives.length > 0 ? (
            <pre className="rounded-md bg-muted p-3 font-mono text-xs">
              {spec.directives.join("\n")}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">Default OWASP CRS</p>
          )}
        </CardContent>
      </Card>

      {status?.conditions && (
        <Card>
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ConditionsTable conditions={status.conditions} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
