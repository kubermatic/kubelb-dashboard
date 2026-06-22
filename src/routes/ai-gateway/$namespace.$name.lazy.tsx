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
import { createLazyFileRoute } from "@tanstack/react-router";
import { FileCode } from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { ConditionsTable } from "@/components/common/conditions-table";
import { DetailSkeleton } from "@/components/common/detail-skeleton";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAgentgatewayBackend } from "@/hooks/use-agentgateway";
import { aiModel, aiProviderLabel, backendKind } from "@/lib/agentgateway";
import type { AgentgatewayBackend } from "@/types/agentgateway";

export const Route = createLazyFileRoute("/ai-gateway/$namespace/$name")({
  component: AgentgatewayBackendDetail,
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </>
  );
}

function AIProviderCard({ backend }: { backend: AgentgatewayBackend }) {
  const secret = backend.spec.policies?.auth?.secretRef?.name;
  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Provider</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <Field label="Provider">
            <Badge variant="outline">{aiProviderLabel(backend) ?? "—"}</Badge>
          </Field>
          <Field label="Model">
            <span className="font-mono text-xs">{aiModel(backend) ?? "—"}</span>
          </Field>
          <Field label="Auth Secret">
            {secret ? <code className="font-mono text-xs">{secret}</code> : "—"}
          </Field>
        </div>
      </CardContent>
    </Card>
  );
}

function MCPTargetsCard({ backend }: { backend: AgentgatewayBackend }) {
  const targets = backend.spec.mcp?.targets ?? [];
  const secret = backend.spec.policies?.auth?.secretRef?.name;
  return (
    <Card>
      <CardHeader>
        <CardTitle>MCP Targets</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {targets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Protocol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((t) => (
                <TableRow key={t.name}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs">{t.backendRef?.name ?? "—"}</TableCell>
                  <TableCell>{t.port ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{t.protocol ?? "—"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">No targets configured</p>
        )}
        {secret && (
          <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
            <Field label="Auth Secret">
              <code className="font-mono text-xs">{secret}</code>
            </Field>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgentgatewayBackendDetail() {
  const { namespace, name } = Route.useParams();
  const { data: backend, isLoading, error, refetch } = useAgentgatewayBackend(namespace, name);
  const [yamlOpen, setYamlOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error) {
    if (error instanceof KubeApiError && error.code === 404) {
      return (
        <ResourceNotFound
          resourceKind="AgentgatewayBackend"
          backHref="/ai-gateway"
          backLabel="AI Gateway"
        />
      );
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!backend) return null;

  const kind = backendKind(backend);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <ResourceHeader
          name={backend.metadata.name}
          namespace={backend.metadata.namespace}
          kind="AgentgatewayBackend"
          createdAt={backend.metadata.creationTimestamp}
          backHref="/ai-gateway"
          backLabel="AI Gateway"
        />
        <Button variant="outline" size="sm" onClick={() => setYamlOpen(true)}>
          <FileCode />
          View YAML
        </Button>
      </div>

      {kind === "ai" ? (
        <AIProviderCard backend={backend} />
      ) : kind === "mcp" ? (
        <MCPTargetsCard backend={backend} />
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Unrecognized backend type. View the YAML for the full specification.
          </CardContent>
        </Card>
      )}

      {backend.status?.conditions && (
        <Card>
          <CardHeader>
            <CardTitle>Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <ConditionsTable conditions={backend.status.conditions} />
          </CardContent>
        </Card>
      )}

      <MetadataSection metadata={backend.metadata} />

      <YamlViewer
        open={yamlOpen}
        onOpenChange={setYamlOpen}
        resource={backend}
        title={`AgentgatewayBackend: ${name}`}
      />
    </div>
  );
}
