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

import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Network,
  Route,
  KeyRound,
  Shield,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Tenants", to: "/tenants", icon: Users },
  { label: "Load Balancers", to: "/load-balancers", icon: Network },
  { label: "Routes", to: "/routes", icon: Route },
  { label: "Sync Secrets", to: "/sync-secrets", icon: KeyRound },
  { label: "Envoy Proxy", to: "/envoy-proxy", icon: Shield },
  { label: "Configuration", to: "/configuration", icon: Settings },
];

function NavLinks({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-1 p-2">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === "/" }}
          className={cn(
            "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-hover",
            collapsed && "justify-center px-0",
          )}
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground",
          }}
          onClick={onNavigate}
        >
          <item.icon className="size-5 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
          {collapsed && (
            <span className="pointer-events-none absolute left-full z-50 ml-2 hidden rounded-md bg-card px-2 py-1 text-xs text-card-foreground shadow-md group-hover:block">
              {item.label}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out md:flex",
        collapsed ? "w-[70px]" : "w-[264px]",
      )}
    >
      <NavLinks collapsed={collapsed} />
      <div className="border-t border-border p-2">
        <button
          onClick={toggleSidebar}
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
            className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-hover"
          >
            <X className="size-5" />
          </button>
        </div>
        <NavLinks collapsed={false} onNavigate={close} />
      </aside>
    </div>
  );
}
