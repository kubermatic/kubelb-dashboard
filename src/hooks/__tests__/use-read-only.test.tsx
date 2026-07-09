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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { fetchAppConfig, getCachedAppConfig } from "@/api/config";
import { useReadOnly } from "../use-read-only";

vi.mock("@/api/config", () => ({
  fetchAppConfig: vi.fn(),
  getCachedAppConfig: vi.fn(),
}));

const mockFetch = vi.mocked(fetchAppConfig);
const mockGetCached = vi.mocked(getCachedAppConfig);

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useReadOnly", () => {
  it("returns true synchronously from the cached config", () => {
    mockGetCached.mockReturnValue({ authEnabled: false, readOnly: true, watchEnabled: false });
    const { result } = renderHook(() => useReadOnly(), { wrapper });
    expect(result.current).toBe(true);
  });

  it("returns false from the cached config", () => {
    mockGetCached.mockReturnValue({ authEnabled: false, readOnly: false, watchEnabled: false });
    const { result } = renderHook(() => useReadOnly(), { wrapper });
    expect(result.current).toBe(false);
  });

  it("falls back to fetching when no cache is present", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockFetch.mockResolvedValue({ authEnabled: false, readOnly: true, watchEnabled: false });
    const { result } = renderHook(() => useReadOnly(), { wrapper });
    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(true));
  });
});
