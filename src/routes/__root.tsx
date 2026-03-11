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

import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Layout } from "@/components/layout/layout";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { NotFound } from "@/components/common/not-found";

export const Route = createRootRoute({
  component: () => (
    <ErrorBoundary>
      <Layout>
        <Outlet />
        <TanStackRouterDevtools position="bottom-right" />
      </Layout>
    </ErrorBoundary>
  ),
  notFoundComponent: NotFound,
});
