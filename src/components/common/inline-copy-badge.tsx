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
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InlineCopyBadgeProps {
  value: string;
}

export function InlineCopyBadge({ value }: InlineCopyBadgeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex cursor-copy items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-sm font-medium text-foreground hover:bg-muted/80"
      aria-label={`Copy "${value}" to clipboard`}
    >
      {value}
      <span className="grid [&>*]:col-start-1 [&>*]:row-start-1">
        <Copy
          className={cn(
            "size-3 text-muted-foreground transition-[opacity,transform] duration-200",
            copied ? "scale-75 opacity-0" : "scale-100 opacity-100",
          )}
        />
        <Check
          className={cn(
            "size-3 text-success transition-[opacity,transform] duration-200",
            copied ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        />
      </span>
    </button>
  );
}
