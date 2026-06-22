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

import React from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReadOnly } from "@/hooks/use-read-only";
import { visibleRowActions, type RowAction, type RowActionsProps } from "./row-actions.helpers";

function stopRowEvent(e: React.MouseEvent | React.PointerEvent) {
  e.stopPropagation();
}

export function RowActions({ actions }: RowActionsProps) {
  const readOnly = useReadOnly();
  const visibleActions = visibleRowActions(actions, readOnly);

  if (visibleActions.length === 0) return null;

  return (
    <DropdownMenu>
      <div role="presentation" onPointerDown={stopRowEvent} onClick={stopRowEvent}>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm">
              <MoreHorizontal data-icon />
              <span className="sr-only">Open actions</span>
            </Button>
          }
        />
      </div>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          {visibleActions.map((action) => (
            <React.Fragment key={action.label}>
              {action.separator && <DropdownMenuSeparator />}
              <DropdownMenuItem variant={action.variant} onClick={action.onClick}>
                {action.icon && <action.icon data-icon />}
                {action.label}
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { RowAction, RowActionsProps };
