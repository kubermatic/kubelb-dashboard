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
import { invalidateAuthCache } from "@/lib/auth-cache";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import { useCallback, useEffect } from "react";

import { env } from "@/lib/env";

const isMock = env.VITE_MOCK;

const FEATURE_PILLS = ["Multi-cluster", "Cloud-native", "Gateway API"];

export function LoginPage() {
  const { isAuthenticated, authEnabled, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    if (isMock) {
      sessionStorage.setItem("kubelb-mock-session", "true");
      invalidateAuthCache();
      queryClient.removeQueries({ queryKey: queryKeys.auth.session() });
      void navigate({ to: search.return_to ?? "/" });
      return;
    }
    const params = search.return_to ? `?return_to=${encodeURIComponent(search.return_to)}` : "";
    window.location.href = `/auth/login${params}`;
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        !(e.target instanceof HTMLAnchorElement) &&
        !(e.target instanceof HTMLButtonElement)
      )
        handleLogin();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search.return_to],
  );

  return (
    <div className="dark">
      <div
        className="relative min-h-screen overflow-hidden bg-background font-sans outline-none"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Background grid */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]">
          <defs>
            <pattern id="kubelb-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-secondary"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kubelb-grid)" />
        </svg>

        {/* Glow */}
        <div className="pointer-events-none absolute -top-15 left-1/2 h-[300px] w-[400px] -translate-x-1/2 bg-[radial-gradient(ellipse,var(--color-secondary)/_0.08_0%,transparent_70%)]" />

        {/* Main content */}
        <div className="mx-auto flex min-h-screen max-w-[420px] flex-col items-center justify-center px-6 pb-16">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="kubermatic-hero-logo mx-auto mb-4 flex h-20 w-20 items-center justify-center text-secondary">
              <svg width="72" height="72" viewBox="-2 -2 134 116" fill="none">
                <path
                  d="M78 .8v30.3L38 50.8V20.6z"
                  fill="currentColor"
                  className="logo-piece logo-piece-1"
                />
                <path
                  d="M128 20.6v30.2L88 31.1V.8z"
                  fill="currentColor"
                  className="logo-piece logo-piece-2"
                />
                <path
                  d="M78 80v30.3L38 90.6V60.3z"
                  fill="currentColor"
                  className="logo-piece logo-piece-3"
                />
                <path
                  d="M128 60.3v30.3l-40 19.7V80z"
                  fill="currentColor"
                  className="logo-piece logo-piece-4"
                />
                <path
                  d="M28 20.8L0 1.2v110l28-19.7z"
                  fill="currentColor"
                  className="logo-piece logo-piece-5"
                />
              </svg>
            </div>
            <h1 className="mb-1.5 text-[28px] font-medium tracking-tight text-foreground">
              KubeLB
            </h1>
            <p className="text-sm font-normal tracking-[1.5px] text-secondary">
              CENTRALIZED LOAD BALANCING
            </p>
          </div>

          {/* Value proposition */}
          <p className="mx-auto mb-7 max-w-[360px] text-center text-[15px] leading-relaxed text-muted-foreground">
            Unified data plane management across your multi-cluster and multi-tenant Kubernetes
            environments.
          </p>

          {/* Feature pills */}
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {FEATURE_PILLS.map((label) => (
              <span
                key={label}
                className="rounded-full border border-secondary/20 bg-secondary/10 px-3.5 py-1 text-xs text-secondary"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Sign In */}
          <div className="mb-4 text-center">
            <button
              onClick={handleLogin}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border-none bg-secondary px-9 py-3 text-[15px] font-medium tracking-wide text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Sign In
            </button>
          </div>
          <p className="mb-2 text-center text-xs text-muted-foreground/60">
            Authenticate via your identity provider
          </p>
          <p className="text-center text-[11px] text-muted-foreground/40">
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
              Enter ↵
            </kbd>{" "}
            to sign in
          </p>
        </div>

        {/* Footer */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-6 border-t border-border/20 px-8 py-5">
          <a
            href="https://www.kubermatic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground no-underline"
          >
            <img src="/kubermatic-logo.png" alt="" className="h-3.5 w-3.5 object-contain" />
            Kubermatic
          </a>
          <span className="text-border">&middot;</span>
          <a
            href="https://docs.kubermatic.com/kubelb"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground no-underline"
          >
            Documentation
          </a>
          <span className="text-border">&middot;</span>
          <a
            href="https://www.kubermatic.com/contact-us"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground no-underline"
          >
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
