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

import { CalendarClock } from "lucide-react";

import { AgeCell } from "@/components/common/age-cell";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { QueryError } from "@/components/common/query-error";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEvents } from "@/hooks/use-events";
import type { KubeEvent } from "@/types/kubernetes";

interface EventsSectionProps {
  namespace: string;
  name: string;
  uid?: string;
}

function eventTimestamp(event: KubeEvent): string | undefined {
  return event.lastTimestamp ?? event.eventTime;
}

function EventRow({ event }: { event: KubeEvent }) {
  const isWarning = event.type === "Warning";
  return (
    <TableRow>
      <TableCell>
        <Badge
          variant="outline"
          className={isWarning ? "bg-destructive/10 text-destructive" : "bg-muted"}
        >
          {event.type ?? "Normal"}
        </Badge>
      </TableCell>
      <TableCell className="font-medium">{event.reason ?? "—"}</TableCell>
      <TableCell className="max-w-xs truncate" title={event.message}>
        {event.message ?? "—"}
      </TableCell>
      <TableCell>{event.count ?? 1}</TableCell>
      <TableCell>
        <AgeCell timestamp={eventTimestamp(event)} />
      </TableCell>
    </TableRow>
  );
}

export function EventsSection({ namespace, name, uid }: EventsSectionProps) {
  const { data, isLoading, error, refetch } = useEvents(namespace, name, uid);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          <TableSkeleton rows={3} columns={5} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          <QueryError error={error} onRetry={() => void refetch()} />
        </CardContent>
      </Card>
    );
  }

  const events = [...(data?.items ?? [])].sort((a, b) => {
    const aTime = eventTimestamp(a) ?? a.metadata.creationTimestamp ?? "";
    const bTime = eventTimestamp(b) ?? b.metadata.creationTimestamp ?? "";
    return bTime.localeCompare(aTime);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No events" />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <EventRow key={event.metadata.uid ?? event.metadata.name} event={event} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
