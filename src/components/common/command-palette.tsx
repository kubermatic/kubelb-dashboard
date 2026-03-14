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

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import { Users, Network, Route, KeyRound, ShieldAlert, Search } from "lucide-react";
import { useEdition } from "@/hooks/use-edition";
import { useTenants } from "@/hooks/use-tenants";
import { useLoadBalancers } from "@/hooks/use-load-balancers";
import { useRoutes } from "@/hooks/use-routes";
import { useSyncSecrets } from "@/hooks/use-sync-secrets";
import { useWAFPolicies } from "@/hooks/use-waf-policies";
import { navItems } from "@/lib/nav-items";
import type { LucideIcon } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isEE } = useEdition();

  const { data: tenants } = useTenants({ enabled: open });
  const { data: loadBalancers } = useLoadBalancers(undefined, { enabled: open });
  const { data: routes } = useRoutes(undefined, { enabled: open });
  const { data: syncSecrets } = useSyncSecrets(undefined, { enabled: open });
  const { data: wafPolicies } = useWAFPolicies({ enabled: open });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const select = useCallback(
    (to: string) => {
      setOpen(false);
      void navigate({ to });
    },
    [navigate],
  );

  const filteredPages = navItems
    .filter((p) => !p.ee || isEE)
    .flatMap((p) => (p.children ? [p, ...p.children] : [p]));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-label="Close command palette"
        tabIndex={-1}
      />
      <div className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2">
        <Command
          className="rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl"
          label="Command palette"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Command.Input
              placeholder="Search pages and resources..."
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            <Command.Group heading="Pages" className="command-group">
              {filteredPages.map((page) => (
                <Command.Item
                  key={page.to}
                  value={page.label}
                  onSelect={() => select(page.to)}
                  className="command-item"
                >
                  <page.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span>{page.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <ResourceGroup
              heading="Tenants"
              icon={Users}
              items={tenants?.items}
              onSelect={(name) => select(`/tenants/${name}`)}
            />

            <ResourceGroup
              heading="Load Balancers"
              icon={Network}
              items={loadBalancers?.items}
              onSelect={(name, ns) => select(`/load-balancers/${ns}/${name}`)}
            />

            <ResourceGroup
              heading="Routes"
              icon={Route}
              items={routes?.items}
              onSelect={(name, ns) => select(`/routes/${ns}/${name}`)}
            />

            <ResourceGroup
              heading="Sync Secrets"
              icon={KeyRound}
              items={syncSecrets?.items}
              onSelect={(name, ns) => select(`/sync-secrets/${ns}/${name}`)}
            />

            {isEE && (
              <ResourceGroup
                heading="WAF Policies"
                icon={ShieldAlert}
                items={wafPolicies?.items}
                onSelect={(name) => select(`/waf-policies/${name}`)}
              />
            )}
          </Command.List>

          <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              Esc
            </kbd>{" "}
            to close
          </div>
        </Command>
      </div>
    </div>
  );
}

interface ResourceGroupProps {
  heading: string;
  icon: LucideIcon;
  items?: Array<{ metadata: { name: string; namespace?: string } }>;
  onSelect: (name: string, namespace: string) => void;
}

function ResourceGroup({ heading, icon: Icon, items, onSelect }: ResourceGroupProps) {
  if (!items?.length) return null;

  return (
    <Command.Group heading={heading} className="command-group">
      {items.map((item) => {
        const { name, namespace = "" } = item.metadata;
        const displayValue = namespace ? `${namespace}/${name}` : name;
        return (
          <Command.Item
            key={`${namespace}-${name}`}
            value={`${heading} ${displayValue}`}
            onSelect={() => onSelect(name, namespace)}
            className="command-item"
          >
            <Icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayValue}</span>
          </Command.Item>
        );
      })}
    </Command.Group>
  );
}
