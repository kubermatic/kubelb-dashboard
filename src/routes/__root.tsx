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

import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Layout } from "@/components/layout/layout";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { NotFound } from "@/components/common/not-found";

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Layout>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </Layout>
    </ErrorBoundary>
  );
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/login") return;

    const response = await fetch("/auth/session", { credentials: "include" });
    if (response.status === 404) return;

    const data = (await response.json()) as { authenticated: boolean };
    if (!data.authenticated) {
      throw redirect({
        to: "/login",
        search: { return_to: location.pathname },
      });
    }
  },
  component: RootComponent,
  notFoundComponent: NotFound,
});
