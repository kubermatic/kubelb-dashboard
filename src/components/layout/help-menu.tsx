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

import { BookOpen, Bug, CircleHelp, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const helpLinks = [
  {
    label: "Documentation",
    description: "Guides and API reference",
    href: "https://docs.kubermatic.com/kubelb",
    icon: BookOpen,
  },
  {
    label: "Release Notes",
    description: "What's new in each version",
    href: "http://docs.kubermatic.com/kubelb/latest/release-notes/",
    icon: Newspaper,
  },
  {
    label: "Report Issue",
    description: "Open a bug report on GitHub",
    href: "https://github.com/kubermatic/kubelb/issues",
    icon: Bug,
  },
];

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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Help & Support</DropdownMenuLabel>
          {helpLinks.map((link) => (
            <DropdownMenuItem
              key={link.href}
              render={<a href={link.href} target="_blank" rel="noopener noreferrer" />}
              className="flex-col items-start gap-0.5 py-2"
            >
              <span className="flex items-center gap-2 font-medium">
                <link.icon className="size-4 shrink-0 text-muted-foreground" />
                {link.label}
              </span>
              <span className="pl-6 text-xs text-muted-foreground">{link.description}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
