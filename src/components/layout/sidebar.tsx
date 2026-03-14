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

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useEdition } from "@/hooks/use-edition";
import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "@/lib/nav-items";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Group nav items by category
const navGroups = {
  main: ["Overview"],
  resources: ["Tenants", "Load Balancers", "Routes", "Sync Secrets"],
  infrastructure: ["Envoy Proxy", "Configuration"],
  security: ["WAF Policies"],
};

function NavLinks({
  collapsed,
  onNavigate,
  ee,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  ee?: boolean;
}) {
  const filtered = useMemo(() => navItems.filter((item) => !item.ee || ee), [ee]);
  const [manualExpanded, setManualExpanded] = useState<Set<string>>(new Set());
  const { pathname } = useLocation();

  const autoExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const item of filtered) {
      if (item.children?.some((child) => pathname.startsWith(child.to))) {
        set.add(item.to);
      }
    }
    return set;
  }, [pathname, filtered]);

  const expanded = useMemo(
    () => new Set([...autoExpanded, ...manualExpanded]),
    [autoExpanded, manualExpanded],
  );

  const toggleExpanded = (to: string) => {
    setManualExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to);
      else next.add(to);
      return next;
    });
  };

  const isActive = (item: NavItem) => {
    if (item.to === "/") return pathname === "/";
    return pathname.startsWith(item.to);
  };

  const renderItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.to);
    const active = isActive(item);

    if (hasChildren && !collapsed) {
      return (
        <div key={item.to}>
          <div className="flex items-center">
            <Link
              to={item.to}
              activeOptions={{ exact: false }}
              className={cn(
                "group relative flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
                active
                  ? "bg-sidebar-accent/15 text-sidebar-accent"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white",
              )}
              onClick={() => {
                setManualExpanded((prev) => new Set([...prev, item.to]));
                onNavigate?.();
              }}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 bg-sidebar-accent" />
              )}
              <item.icon className={cn("size-[18px] shrink-0", active && "text-sidebar-accent")} />
              <span>{item.label}</span>
            </Link>
            <button
              onClick={() => toggleExpanded(item.to)}
              className="mr-1 rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-hover hover:text-white"
            >
              <ChevronRight
                className={cn(
                  "size-4 transition-transform duration-200",
                  isExpanded && "rotate-90",
                )}
              />
            </button>
          </div>
          {isExpanded && (
            <div className="ml-5 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
              {item.children!.map((child) => {
                const childActive = pathname.startsWith(child.to);
                return (
                  <Link
                    key={child.to}
                    to={child.to}
                    activeOptions={{ exact: false }}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-200",
                      childActive
                        ? "bg-sidebar-accent/15 text-sidebar-accent"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-hover hover:text-white",
                    )}
                    onClick={onNavigate}
                  >
                    <child.icon className="size-4 shrink-0" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (collapsed) {
      return (
        <Tooltip key={item.to}>
          <TooltipTrigger
            render={
              <Link
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className={cn(
                  "group relative flex items-center justify-center rounded-lg p-2.5 transition-all duration-200 active:scale-[0.98]",
                  active
                    ? "bg-sidebar-accent/15 text-sidebar-accent"
                    : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white",
                )}
                onClick={onNavigate}
              />
            }
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 bg-sidebar-accent" />
            )}
            <item.icon className="size-[18px] shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.to}
        to={item.to}
        activeOptions={{ exact: item.to === "/" }}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
          active
            ? "bg-sidebar-accent/15 text-sidebar-accent"
            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-white",
        )}
        onClick={onNavigate}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 bg-sidebar-accent" />
        )}
        <item.icon className={cn("size-[18px] shrink-0", active && "text-sidebar-accent")} />
        <span>{item.label}</span>
      </Link>
    );
  };

  const { mainItems, resourceItems, infraItems, securityItems } = useMemo(
    () => ({
      mainItems: filtered.filter((item) => navGroups.main.includes(item.label)),
      resourceItems: filtered.filter((item) => navGroups.resources.includes(item.label)),
      infraItems: filtered.filter((item) => navGroups.infrastructure.includes(item.label)),
      securityItems: filtered.filter((item) => navGroups.security.includes(item.label)),
    }),
    [filtered],
  );

  const sectionLabel = (label: string) =>
    collapsed ? null : (
      <div className="px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sidebar-foreground/40">
          {label}
        </span>
      </div>
    );

  return (
    <TooltipProvider>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main */}
        <div
          className="animate-enter space-y-1"
          style={{ "--enter-delay": "0ms" } as React.CSSProperties}
        >
          {mainItems.map(renderItem)}
        </div>

        {/* Resources */}
        {resourceItems.length > 0 && (
          <div
            className="animate-enter mt-6"
            style={{ "--enter-delay": "60ms" } as React.CSSProperties}
          >
            {sectionLabel("Resources")}
            <div className="space-y-1">{resourceItems.map(renderItem)}</div>
          </div>
        )}

        {/* Security (EE only) */}
        {securityItems.length > 0 && (
          <div
            className="animate-enter mt-6"
            style={{ "--enter-delay": "120ms" } as React.CSSProperties}
          >
            {sectionLabel("Security")}
            <div className="space-y-1">{securityItems.map(renderItem)}</div>
          </div>
        )}

        {/* Infrastructure */}
        {infraItems.length > 0 && (
          <div
            className="animate-enter mt-6"
            style={{ "--enter-delay": "180ms" } as React.CSSProperties}
          >
            {sectionLabel("Infrastructure")}
            <div className="space-y-1">{infraItems.map(renderItem)}</div>
          </div>
        )}
      </nav>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isEE, loading: editionLoading } = useEdition();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out md:flex",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <NavLinks collapsed={collapsed} ee={isEE} />

      <div className="shrink-0 border-t border-sidebar-border">
        {!collapsed && !editionLoading && (
          <div className="flex items-center justify-center gap-1.5 border-b border-sidebar-border bg-sidebar-accent/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-sidebar-accent/80">
            <span className="h-1.5 w-1.5 rounded-full bg-sidebar-accent/60" />
            {isEE ? "Enterprise Edition" : "Community Edition"}
            {import.meta.env.VITE_MOCK === "true" && (
              <>
                <span className="text-sidebar-foreground/20">|</span>
                <span className="text-amber-400/80">Mock Mode</span>
              </>
            )}
          </div>
        )}
        <div className="p-3">
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sidebar-foreground/50 transition-all duration-200 hover:bg-sidebar-hover hover:text-white",
              !collapsed && "px-3",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px]" />
            ) : (
              <>
                <PanelLeftClose className="size-[18px]" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar() {
  const open = useUIStore((s) => s.mobileSidebarOpen);
  const close = useUIStore((s) => s.closeMobileSidebar);
  const { isEE } = useEdition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={close} />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-sidebar shadow-2xl transition-transform duration-300">
        {/* Mobile Header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <img src="/kubermatic-logo.png" alt="Kubermatic" className="h-7 w-7" />
            <span className="text-sm font-semibold text-white">KubeLB</span>
          </div>
          <button
            onClick={close}
            aria-label="Close navigation"
            className="rounded-lg p-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-hover hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        <NavLinks collapsed={false} onNavigate={close} ee={isEE} />
      </aside>
    </div>
  );
}
