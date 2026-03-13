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

import { useAuth } from "@/hooks/use-auth";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function LoginPage() {
  const { isAuthenticated, authEnabled, loading } = useAuth();
  const navigate = useNavigate();
  const search: { return_to?: string } = useSearch({ strict: false });

  useEffect(() => {
    if (!loading && !authEnabled) {
      void navigate({ to: "/" });
    }
    if (!loading && authEnabled && isAuthenticated) {
      void navigate({ to: search.return_to ?? "/" });
    }
  }, [loading, authEnabled, isAuthenticated, navigate, search.return_to]);

  const handleLogin = () => {
    const params = search.return_to ? `?return_to=${encodeURIComponent(search.return_to)}` : "";
    window.location.href = `/auth/login${params}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">KubeLB Dashboard</CardTitle>
          <CardDescription>Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} className="w-full" size="lg">
            Sign in
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
