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

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAge } from "@/lib/format";
import type { Condition } from "@/types/kubernetes";

interface ConditionsTableProps {
  conditions: Condition[];
}

function statusVariant(status: Condition["status"]) {
  if (status === "True") return "bg-success/10 text-success" as const;
  if (status === "False") return "bg-destructive/10 text-destructive" as const;
  return "bg-warning/10 text-warning" as const;
}

export function ConditionsTable({ conditions }: ConditionsTableProps) {
  if (!conditions.length) {
    return <p className="text-sm text-muted-foreground">No conditions.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Last Transition</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conditions.map((c) => (
            <TableRow key={c.type}>
              <TableCell className="font-medium">{c.type}</TableCell>
              <TableCell>
                <Badge className={statusVariant(c.status)} variant="outline">
                  {c.status}
                </Badge>
              </TableCell>
              <TableCell>{c.reason}</TableCell>
              <TableCell className="max-w-xs truncate">{c.message}</TableCell>
              <TableCell>{formatAge(c.lastTransitionTime)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
