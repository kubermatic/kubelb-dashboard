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

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/api/query-keys";
import { fetchAppConfig } from "@/api/config";
import { invalidateAuthCache } from "@/lib/auth-cache";

interface User {
  email: string;
  name: string;
  groups: string[];
}

interface SessionResponse {
  authenticated: boolean;
  user?: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authEnabled: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

async function fetchSession(): Promise<{
  authEnabled: boolean;
  authenticated: boolean;
  user?: User;
}> {
  const config = await fetchAppConfig();
  if (!config.authEnabled) {
    return { authEnabled: false, authenticated: true };
  }

  const response = await fetch("/auth/session", { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Session check failed: ${response.status}`);
  }

  const data = (await response.json()) as SessionResponse;
  return {
    authEnabled: true,
    authenticated: data.authenticated,
    user: data.user,
  };
}

export function useAuth(): AuthState {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: fetchSession,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const logout = useCallback(async () => {
    try {
      await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
    } catch {
      // Best-effort — cookies may already be cleared
    }
    queryClient.removeQueries({ queryKey: queryKeys.auth.session() });
    invalidateAuthCache();
    window.location.href = "/login";
  }, [queryClient]);

  if (isLoading || !data) {
    return { user: null, isAuthenticated: false, authEnabled: true, loading: true, logout };
  }

  return {
    user: data.user ?? null,
    isAuthenticated: data.authenticated,
    authEnabled: data.authEnabled,
    loading: false,
    logout,
  };
}
