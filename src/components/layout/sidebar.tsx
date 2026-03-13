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

import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { useEdition } from "@/hooks/use-edition";
import { cn } from "@/lib/utils";
import { navItems, type NavItem } from "@/lib/nav-items";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function NavLinks({
  collapsed,
  onNavigate,
  ee,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  ee?: boolean;
}) {
  const filtered = navItems.filter((item) => !item.ee || ee);
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

  const linkClass = (isCollapsed: boolean) =>
    cn(
      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-hover",
      isCollapsed && "justify-center px-0",
    );

  const renderItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expanded.has(item.to);

    if (hasChildren && !collapsed) {
      return (
        <div key={item.to}>
          <div className="flex items-center">
            <Link
              to={item.to}
              activeOptions={{ exact: false }}
              className={cn(linkClass(false), "flex-1")}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground",
              }}
              onClick={onNavigate}
            >
              <item.icon className="size-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
            <button
              onClick={() => toggleExpanded(item.to)}
              className="rounded-md p-1.5 text-sidebar-foreground hover:bg-sidebar-hover"
            >
              <ChevronRight
                className={cn("size-4 transition-transform", isExpanded && "rotate-90")}
              />
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4 space-y-1 border-l border-border/50 pl-2">
              {item.children!.map((child) => (
                <Link
                  key={child.to}
                  to={child.to}
                  activeOptions={{ exact: false }}
                  className={cn(linkClass(false), "gap-2 py-1.5 text-xs")}
                  activeProps={{
                    className: "bg-sidebar-accent text-sidebar-accent-foreground",
                  }}
                  onClick={onNavigate}
                >
                  <child.icon className="size-4 shrink-0" />
                  <span>{child.label}</span>
                </Link>
              ))}
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
                className={linkClass(true)}
                activeProps={{
                  className: "bg-sidebar-accent text-sidebar-accent-foreground",
                }}
                onClick={onNavigate}
              />
            }
          >
            <item.icon className="size-5 shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        key={item.to}
        to={item.to}
        activeOptions={{ exact: item.to === "/" }}
        className={linkClass(false)}
        activeProps={{
          className: "bg-sidebar-accent text-sidebar-accent-foreground",
        }}
        onClick={onNavigate}
      >
        <item.icon className="size-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <TooltipProvider>
      <nav className="flex-1 space-y-1 p-2">{filtered.map(renderItem)}</nav>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isEE } = useEdition();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out md:flex",
        collapsed ? "w-[70px]" : "w-[264px]",
      )}
    >
      <NavLinks collapsed={collapsed} ee={isEE} />
      <div className="border-t border-border p-2">
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center justify-center rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-hover"
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </button>
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
      <aside className="fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-sidebar shadow-lg transition-transform duration-300">
        <div className="flex h-[60px] items-center justify-between border-b border-border px-4">
          <span className="text-lg font-semibold text-sidebar-foreground">KubeLB</span>
          <button
            onClick={close}
            aria-label="Close navigation"
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-hover"
          >
            <X className="size-5" />
          </button>
        </div>
        <NavLinks collapsed={false} onNavigate={close} ee={isEE} />
      </aside>
    </div>
  );
}
