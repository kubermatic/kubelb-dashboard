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

import { type ReactNode, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { InlineCopyBadge } from "@/components/common/inline-copy-badge";

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  resourceKind: string;
  onConfirm: () => void;
  isPending?: boolean;
  children?: ReactNode;
}

export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  resourceKind,
  onConfirm,
  isPending,
  children,
}: BulkDeleteDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const isConfirmed = confirmation === "confirm";

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmation("");
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent data-testid="bulk-delete-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {resourceKind}
            {count !== 1 ? "s" : ""}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {count} selected {resourceKind.toLowerCase()}
            {count !== 1 ? "s" : ""}? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {children}

        <div className="grid gap-2">
          <label htmlFor="bulk-delete-confirmation" className="text-sm text-muted-foreground">
            Type <InlineCopyBadge value="confirm" /> to proceed
          </label>
          <Input
            id="bulk-delete-confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!isConfirmed || isPending}
            onClick={onConfirm}
          >
            {isPending
              ? "Deleting..."
              : `Delete ${count} ${resourceKind.toLowerCase()}${count !== 1 ? "s" : ""}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
