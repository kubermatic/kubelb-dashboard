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

import { ExternalLink } from "lucide-react";

const links = [
  { label: "Documentation", href: "https://docs.kubermatic.com/kubelb" },
  { label: "GitHub", href: "https://github.com/kubermatic/kubelb" },
];

export function Footer() {
  return (
    <footer className="border-t px-3 py-2 md:px-5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>KubeLB Dashboard</span>
        <div className="flex gap-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {link.label}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
