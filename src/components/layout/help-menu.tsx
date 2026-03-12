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

import { CircleHelp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function HelpMenu() {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} />}
        >
          <CircleHelp className="size-5" />
        </TooltipTrigger>
        <TooltipContent>Help</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          render={
            <a
              href="https://docs.kubermatic.com/kubelb"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <ExternalLink />
          Documentation
        </DropdownMenuItem>
        <DropdownMenuItem
          render={
            <a
              href="https://github.com/kubermatic/kubelb/issues"
              target="_blank"
              rel="noopener noreferrer"
            />
          }
        >
          <ExternalLink />
          Report Issue
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
