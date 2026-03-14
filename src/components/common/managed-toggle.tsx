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

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ManagedToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ManagedToggle({ checked, onCheckedChange }: ManagedToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex items-center gap-2 whitespace-nowrap">
            <Switch id="managed-toggle" checked={checked} onCheckedChange={onCheckedChange} />
            <Label htmlFor="managed-toggle" className="text-sm text-muted-foreground">
              Managed by KubeLB
            </Label>
          </div>
        }
      />
      <TooltipContent>
        Show only resources managed by KubeLB. Disable to see all Kubernetes resources.
      </TooltipContent>
    </Tooltip>
  );
}
