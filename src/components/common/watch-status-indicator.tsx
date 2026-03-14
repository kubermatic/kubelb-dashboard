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

import type { WatchConnectionStatus } from "@/hooks/use-kube-watch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const STATUS_CONFIG: Record<
  WatchConnectionStatus,
  { className: string; label: string; visible: boolean }
> = {
  connecting: {
    className: "bg-warning animate-pulse",
    label: "Connecting to watch stream...",
    visible: true,
  },
  connected: {
    className: "bg-success",
    label: "Live — watch stream connected",
    visible: true,
  },
  reconnecting: {
    className: "bg-warning animate-pulse",
    label: "Reconnecting to watch stream...",
    visible: true,
  },
};

export function WatchStatusIndicator({ status }: { status: WatchConnectionStatus }) {
  const config = STATUS_CONFIG[status];
  if (!config.visible) return null;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex items-center" />}>
        <span className={`size-2 rounded-full ${config.className}`} />
      </TooltipTrigger>
      <TooltipContent>{config.label}</TooltipContent>
    </Tooltip>
  );
}
