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

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Command, Menu, Moon, Search, Sun } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { useUIStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpMenu } from "@/components/layout/help-menu";
import { UserMenu } from "@/components/layout/user-menu";
import { navItems } from "@/lib/nav-items";

function Breadcrumbs() {
  const { pathname } = useLocation();

  const crumbs = useMemo(() => {
    if (pathname === "/") return [{ label: "Overview" }];

    const segments = pathname.split("/").filter(Boolean);
    const basePath = "/" + segments[0];

    const topItem = navItems.find((item) => item.to === basePath);
    if (!topItem) {
      return [{ label: segments[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }];
    }

    const result: { label: string }[] = [{ label: topItem.label }];

    if (segments.length > 1) {
      const childPath = "/" + segments.slice(0, 2).join("/");
      const childItem = topItem.children?.find((c) => c.to === childPath);

      if (childItem) {
        result.push({ label: childItem.label });
        if (segments.length > 2) {
          result.push({ label: segments.slice(2).join("/") });
        }
      } else {
        result.push({ label: segments.slice(1).join("/") });
      }
    }

    return result;
  }, [pathname]);

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="size-3.5" />}
          <span className={i === crumbs.length - 1 ? "text-foreground" : ""}>{crumb.label}</span>
        </span>
      ))}
    </div>
  );
}

export function Header() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const openMobileSidebar = useUIStore((s) => s.openMobileSidebar);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kubelb-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = useCallback(() => setDark((d) => !d), []);

  const openSearch = () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={openMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground md:hidden"
        >
          <Menu className="size-5" />
        </button>

        {/* Mobile Logo */}
        <div className="flex items-center gap-2 md:hidden">
          <img src="/kubermatic-logo.png" alt="Kubermatic" className="h-7 w-7" />
          <span className="text-sm font-semibold text-foreground">KubeLB</span>
        </div>

        {/* Desktop Logo + Breadcrumbs */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2">
            <img src="/kubermatic-logo.png" alt="Kubermatic" className="h-6 w-6" />
            <span className="text-sm font-semibold text-foreground">KubeLB</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <Breadcrumbs />
        </div>
      </div>

      {/* Center Section - Search (Desktop) */}
      <div className="hidden flex-1 justify-center px-4 md:flex">
        <button
          onClick={openSearch}
          className="group flex h-8 w-full max-w-lg items-center gap-3 rounded border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:bg-muted"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search resources...</span>
          <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            {navigator.platform.includes("Mac") ? (
              <>
                <Command className="size-2.5" />K
              </>
            ) : (
              "Ctrl K"
            )}
          </kbd>
        </button>
      </div>

      {/* Right Section */}
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {/* Mobile Search Button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={openSearch}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground md:hidden"
                />
              }
            >
              <Search className="size-[18px]" />
            </TooltipTrigger>
            <TooltipContent>Search</TooltipContent>
          </Tooltip>

          {/* Help Menu */}
          <HelpMenu />

          {/* User Menu */}
          <UserMenu />

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                />
              }
            >
              {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </TooltipTrigger>
            <TooltipContent>{dark ? "Light mode" : "Dark mode"}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  );
}
