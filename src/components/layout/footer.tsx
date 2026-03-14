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

import { useEdition } from "@/hooks/use-edition";
import { cn } from "@/lib/utils";

export function Footer() {
  const { isEE } = useEdition();

  return (
    <footer className="shrink-0 border-t border-border bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground/70">KubeLB</span>
          <span className="text-border">|</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium",
              isEE ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", isEE ? "bg-secondary" : "bg-primary")}
            />
            {isEE ? "Enterprise" : "Community"}
          </span>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <a
            href="https://kubelb.io/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Documentation
          </a>
          <a
            href="https://github.com/kubermatic/kubelb"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
