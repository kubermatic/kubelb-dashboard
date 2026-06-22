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

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { createLazyFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Bot, Server } from "lucide-react";

import { AgeCell } from "@/components/common/age-cell";
import { CopyButton } from "@/components/common/copy-button";
import { DataTable } from "@/components/common/data-table";
import { DataTableColumnHeader } from "@/components/common/data-table-column-header";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { QueryError } from "@/components/common/query-error";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAgentgatewayBackends } from "@/hooks/use-agentgateway";
import { useGateways } from "@/hooks/use-gateways";
import {
  aiModel,
  aiProviderLabel,
  backendKind,
  gatewayEndpoint,
  gatewayListeners,
  gatewayProgrammedCondition,
  isAgentgateway,
  mcpTargetCount,
  validCondition,
} from "@/lib/agentgateway";
import type { GenericResource } from "@/mocks/fixtures/types";
import type { AgentgatewayBackend } from "@/types/agentgateway";

export const Route = createLazyFileRoute("/ai-gateway/")({
  component: AIGateway,
});

function statusCell(backend: AgentgatewayBackend) {
  const condition = validCondition(backend);
  if (!condition) return <span className="text-sm text-muted-foreground">{"—"}</span>;
  return <StatusBadge label={condition.reason || condition.status} status={condition.status} />;
}

function nameCell(backend: AgentgatewayBackend) {
  return (
    <Link
      to="/ai-gateway/$namespace/$name"
      params={{ namespace: backend.metadata.namespace ?? "", name: backend.metadata.name }}
      className="font-medium text-primary hover:underline"
    >
      {backend.metadata.name}
    </Link>
  );
}

function nameColumn(): ColumnDef<AgentgatewayBackend> {
  return {
    accessorKey: "metadata.name",
    id: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => nameCell(row.original),
  };
}

function namespaceColumn(): ColumnDef<AgentgatewayBackend> {
  return {
    id: "namespace",
    meta: { hideBelow: "md" },
    header: "Namespace",
    cell: ({ row }) => <Badge variant="secondary">{row.original.metadata.namespace ?? "—"}</Badge>,
  };
}

function ageColumn(): ColumnDef<AgentgatewayBackend> {
  return {
    accessorKey: "metadata.creationTimestamp",
    id: "age",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Age" />,
    cell: ({ row }) => <AgeCell timestamp={row.original.metadata.creationTimestamp} />,
  };
}

const aiColumns: ColumnDef<AgentgatewayBackend>[] = [
  nameColumn(),
  namespaceColumn(),
  {
    id: "provider",
    header: "Provider",
    cell: ({ row }) => <Badge variant="outline">{aiProviderLabel(row.original) ?? "—"}</Badge>,
  },
  {
    id: "model",
    header: "Model",
    cell: ({ row }) => <span className="font-mono text-xs">{aiModel(row.original) ?? "—"}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => statusCell(row.original),
  },
  ageColumn(),
];

const mcpColumns: ColumnDef<AgentgatewayBackend>[] = [
  nameColumn(),
  namespaceColumn(),
  {
    id: "targets",
    header: "Targets",
    cell: ({ row }) => {
      const count = mcpTargetCount(row.original);
      return (
        <span className="text-sm">
          {count} {count === 1 ? "server" : "servers"}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => statusCell(row.original),
  },
  ageColumn(),
];

function GatewaySummary({ gateways }: { gateways: GenericResource[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Server className="size-4 text-muted-foreground" />
          Gateway Endpoint{gateways.length > 1 ? "s" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gateways.map((gw) => {
          const endpoint = gatewayEndpoint(gw);
          const condition = gatewayProgrammedCondition(gw);
          const listeners = gatewayListeners(gw);
          return (
            <div
              key={`${gw.metadata.namespace ?? ""}/${gw.metadata.name}`}
              className="grid grid-cols-[120px_1fr] items-center gap-x-4 gap-y-2 text-sm"
            >
              <span className="text-muted-foreground">Gateway</span>
              <span className="font-medium">
                {gw.metadata.name}
                {gw.metadata.namespace && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {gw.metadata.namespace}
                  </span>
                )}
              </span>

              <span className="text-muted-foreground">Endpoint</span>
              <span className="flex items-center gap-1">
                {endpoint ? (
                  <>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {endpoint}
                    </code>
                    <CopyButton value={endpoint} />
                  </>
                ) : (
                  <span className="text-muted-foreground">Pending address</span>
                )}
              </span>

              <span className="text-muted-foreground">Listeners</span>
              <span className="flex flex-wrap gap-1.5">
                {listeners.map((l) => (
                  <Badge key={l.name} variant="outline">
                    {l.name} · {l.protocol}:{l.port}
                  </Badge>
                ))}
              </span>

              <span className="text-muted-foreground">Status</span>
              <span>
                {condition ? (
                  <StatusBadge
                    label={condition.reason || condition.status}
                    status={condition.status}
                  />
                ) : (
                  "—"
                )}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function AIGateway() {
  const { tab } = useSearch({ from: "/ai-gateway/" });
  const navigate = useNavigate();

  const backendsQuery = useAgentgatewayBackends();
  const gatewaysQuery = useGateways();

  const items = useMemo(() => backendsQuery.data?.items ?? [], [backendsQuery.data]);
  const aiBackends = useMemo(() => items.filter((b) => backendKind(b) === "ai"), [items]);
  const mcpBackends = useMemo(() => items.filter((b) => backendKind(b) === "mcp"), [items]);

  const agentgateways = useMemo(
    () => (gatewaysQuery.data?.items ?? []).filter(isAgentgateway),
    [gatewaysQuery.data],
  );

  const setTab = (value: string) =>
    void navigate({
      from: "/ai-gateway/",
      search: { tab: value === "mcp" ? "mcp" : "ai" },
      replace: true,
    });

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI & MCP Gateways"
        description="LLM providers and MCP tool servers federated through agentgateway."
      />

      {backendsQuery.isError && backendsQuery.error ? (
        <QueryError error={backendsQuery.error} onRetry={() => void backendsQuery.refetch()} />
      ) : (
        <>
          {agentgateways.length > 0 && <GatewaySummary gateways={agentgateways} />}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="ai">AI Backends ({aiBackends.length})</TabsTrigger>
              <TabsTrigger value="mcp">MCP Backends ({mcpBackends.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-4">
              {!backendsQuery.isLoading && aiBackends.length === 0 ? (
                <EmptyState
                  icon={Bot}
                  title="No AI backends"
                  description="No AgentgatewayBackend resources with an LLM provider were found."
                />
              ) : (
                <DataTable
                  columns={aiColumns}
                  data={aiBackends}
                  isLoading={backendsQuery.isLoading}
                  searchColumn="name"
                  searchPlaceholder="Search AI backends..."
                  onRefresh={() => void backendsQuery.refetch()}
                  isRefetching={backendsQuery.isRefetching}
                  dataUpdatedAt={backendsQuery.dataUpdatedAt}
                  onRowClick={(row) =>
                    void navigate({
                      to: "/ai-gateway/$namespace/$name",
                      params: {
                        namespace: row.original.metadata.namespace ?? "",
                        name: row.original.metadata.name,
                      },
                    })
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="mcp" className="mt-4">
              {!backendsQuery.isLoading && mcpBackends.length === 0 ? (
                <EmptyState
                  icon={Server}
                  title="No MCP backends"
                  description="No AgentgatewayBackend resources federating MCP servers were found."
                />
              ) : (
                <DataTable
                  columns={mcpColumns}
                  data={mcpBackends}
                  isLoading={backendsQuery.isLoading}
                  searchColumn="name"
                  searchPlaceholder="Search MCP backends..."
                  onRefresh={() => void backendsQuery.refetch()}
                  isRefetching={backendsQuery.isRefetching}
                  dataUpdatedAt={backendsQuery.dataUpdatedAt}
                  onRowClick={(row) =>
                    void navigate({
                      to: "/ai-gateway/$namespace/$name",
                      params: {
                        namespace: row.original.metadata.namespace ?? "",
                        name: row.original.metadata.name,
                      },
                    })
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
