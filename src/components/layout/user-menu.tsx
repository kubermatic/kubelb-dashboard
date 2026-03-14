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

import { LogOut, ShieldOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

function UserAvatar({ name, email }: { name?: string; email?: string }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (email?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

export function UserMenu() {
  const { user, authEnabled, logout } = useAuth();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={<DropdownMenuTrigger render={<Button variant="ghost" size="icon" />} />}
        >
          <User className="size-5" />
        </TooltipTrigger>
        <TooltipContent>Account</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        {authEnabled && user ? (
          <div className="flex items-center gap-3 px-2 py-3">
            <UserAvatar name={user.name} email={user.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name || user.email}
              </p>
              {user.name && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <ShieldOff className="size-3.5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Authentication disabled</p>
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={!authEnabled}
            onClick={() => void logout()}
            variant="destructive"
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
