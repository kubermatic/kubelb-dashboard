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
import { ClipboardCheck, ExternalLink, FileCode } from "lucide-react";

import { KubeApiError } from "@/api/kube";
import { DetailSkeleton } from "@/components/common/detail-skeleton";
import { InsightStateBadge, SeverityBadge } from "@/components/common/insights-table";
import { InsightTriageDialog } from "@/components/common/insight-triage-dialog";
import { MetadataSection } from "@/components/common/metadata-section";
import { ResourceNotFound } from "@/components/common/not-found";
import { QueryError } from "@/components/common/query-error";
import { ResourceHeader } from "@/components/common/resource-header";
import { YamlViewer } from "@/components/common/yaml-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInsight } from "@/hooks/use-insights";
import { useTriageInsight } from "@/hooks/use-insight-mutations";
import { useReadOnly } from "@/hooks/use-read-only";
import { dismissalReasonLabel } from "@/lib/insights";
import type { Insight } from "@/types/kubelb";

export const Route = createLazyFileRoute("/insights/$namespace/$name")({
  component: InsightDetail,
});

function InsightDetail() {
  const { namespace, name } = Route.useParams();
  const { data: insight, isLoading, error, refetch } = useInsight(namespace, name);
  const triageInsight = useTriageInsight();
  const readOnly = useReadOnly();

  const [yamlViewerOpen, setYamlViewerOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error) {
    if (error instanceof KubeApiError && error.code === 404) {
      return <ResourceNotFound resourceKind="Insight" backHref="/insights" backLabel="Insights" />;
    }
    return <QueryError error={error} onRetry={() => void refetch()} />;
  }

  if (!insight) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <ResourceHeader
          name={insight.metadata.name}
          namespace={insight.metadata.namespace}
          kind="Insight"
          createdAt={insight.metadata.creationTimestamp}
          backHref="/insights"
          backLabel="Insights"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYamlViewerOpen(true)}>
            <FileCode />
            View YAML
          </Button>
          {!readOnly && (
            <Button size="sm" onClick={() => setTriageOpen(true)}>
              <ClipboardCheck />
              Triage
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab insight={insight} />
        </TabsContent>

        <TabsContent value="metadata">
          <MetadataSection metadata={insight.metadata} />
        </TabsContent>
      </Tabs>

      <YamlViewer
        open={yamlViewerOpen}
        onOpenChange={setYamlViewerOpen}
        resource={insight}
        title={`Insight: ${name}`}
      />

      <InsightTriageDialog
        open={triageOpen}
        onOpenChange={setTriageOpen}
        insight={insight}
        isPending={triageInsight.isPending}
        onSubmit={(action) => {
          void triageInsight
            .mutateAsync({ namespace, name, action })
            .then(() => setTriageOpen(false));
        }}
      />
    </div>
  );
}

function formatTime(timestamp?: string): string {
  return timestamp ? new Date(timestamp).toLocaleString() : "—";
}

function OverviewTab({ insight }: { insight: Insight }) {
  const { spec, status } = insight;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono">{spec.check}</span>
            <span className="text-sm font-normal text-muted-foreground">{spec.slug}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={spec.severity} />
            <Badge variant="outline">{spec.category}</Badge>
            <InsightStateBadge insight={insight} />
          </div>
          <p className="text-sm">{spec.message}</p>
          {spec.docsURL && (
            <a
              href={spec.docsURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Check documentation
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Triage</CardTitle>
        </CardHeader>
        <CardContent>
          {spec.triage ? (
            <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Decision</span>
              <span data-testid="triage-state">{spec.triage.state}</span>
              {spec.triage.reason && (
                <>
                  <span className="text-muted-foreground">Reason</span>
                  <span data-testid="triage-reason">
                    {dismissalReasonLabel(spec.triage.reason)}
                  </span>
                </>
              )}
              {spec.triage.snoozeUntil && (
                <>
                  <span className="text-muted-foreground">Snoozed until</span>
                  <span>{formatTime(spec.triage.snoozeUntil)}</span>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="triage-state">
              Not triaged. The finding is open.
            </p>
          )}
        </CardContent>
      </Card>

      {(spec.remediation?.summary || spec.remediation?.snippet) && (
        <Card>
          <CardHeader>
            <CardTitle>Remediation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {spec.remediation.summary && <p className="text-sm">{spec.remediation.summary}</p>}
            {spec.remediation.snippet && (
              <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">
                {spec.remediation.snippet}
              </pre>
            )}
            <p className="text-xs text-muted-foreground">
              Remediation is documentation only — KubeLB never applies it.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Targets</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kind</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>API Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spec.targetRefs.map((ref, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{ref.kind}</TableCell>
                  <TableCell className="font-mono text-sm">{ref.name}</TableCell>
                  <TableCell className="text-sm">{ref.namespace ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{ref.apiVersion}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {spec.evidence && spec.evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spec.evidence.map((ev, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline">{ev.type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ev.ref}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ev.note ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
            <span className="text-muted-foreground">State</span>
            <span>
              <InsightStateBadge insight={insight} />
            </span>
            <span className="text-muted-foreground">First Seen</span>
            <span>{formatTime(status?.firstSeen)}</span>
            <span className="text-muted-foreground">Last Evaluated</span>
            <span>{formatTime(status?.lastEvaluated)}</span>
            {status?.fixedAt && (
              <>
                <span className="text-muted-foreground">Fixed At</span>
                <span>{formatTime(status.fixedAt)}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
