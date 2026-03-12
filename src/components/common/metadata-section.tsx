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
import { ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTimestamp } from "@/lib/format";
import type { ObjectMeta } from "@/types/kubernetes";

import { KeyValuePairs } from "./key-value-pairs";

interface MetadataSectionProps {
  metadata: ObjectMeta;
}

export function MetadataSection({ metadata }: MetadataSectionProps) {
  const [showAnnotations, setShowAnnotations] = useState(false);
  const annotations = metadata.annotations ?? {};
  const labels = metadata.labels ?? {};
  const annotationCount = Object.keys(annotations).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-y-2">
            <span className="text-muted-foreground">UID</span>
            <span className="font-mono text-xs break-all">{metadata.uid ?? "—"}</span>
            <span className="text-muted-foreground">Resource Version</span>
            <span>{metadata.resourceVersion ?? "—"}</span>
            <span className="text-muted-foreground">Created</span>
            <span>
              {metadata.creationTimestamp ? formatTimestamp(metadata.creationTimestamp) : "—"}
            </span>
            {metadata.generation !== undefined && (
              <>
                <span className="text-muted-foreground">Generation</span>
                <span>{metadata.generation}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Labels</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(labels).length ? (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(labels).map(([k, v]) => (
                <Badge key={k} variant="outline" className="font-mono text-xs">
                  {k}={v}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No labels.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <button
            type="button"
            className="flex w-full items-center gap-2"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            {showAnnotations ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            <CardTitle>Annotations ({annotationCount})</CardTitle>
          </button>
        </CardHeader>
        {showAnnotations && (
          <CardContent>
            <KeyValuePairs data={annotations} emptyMessage="No annotations." />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
