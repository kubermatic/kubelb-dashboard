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
import { Menu, Moon, Sun } from "lucide-react";
import { useUIStore } from "@/stores/ui";

export function Header() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const openMobileSidebar = useUIStore((s) => s.openMobileSidebar);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("kubelb-theme", dark ? "dark" : "light");
  }, [dark]);

  const toggleTheme = useCallback(() => setDark((d) => !d), []);

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <button
          onClick={openMobileSidebar}
          className="rounded-md p-2 text-foreground hover:bg-surface-hover md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <span className="text-lg font-semibold text-foreground">
          <span className="md:hidden">KubeLB</span>
          <span className="hidden md:inline">KubeLB Dashboard</span>
        </span>
      </div>
      <button
        onClick={toggleTheme}
        className="rounded-md p-2 text-foreground hover:bg-surface-hover"
      >
        {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>
    </header>
  );
}
