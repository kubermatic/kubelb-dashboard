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

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement, type ReactNode } from "react";
import { KubeApiError, kubeList, kubeWatch } from "@/api/kube";
import { POLL_INTERVAL } from "@/lib/constants";
import type { KubeList, ObjectMeta, WatchEvent } from "@/types/kubernetes";
import { useKubeWatch } from "../use-kube-watch";

vi.mock("@/api/kube", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/kube")>();
  return {
    ...actual,
    kubeList: vi.fn(),
    kubeWatch: vi.fn(),
  };
});

interface Item {
  metadata: ObjectMeta;
  value?: string;
}

const mockKubeList = vi.mocked(kubeList);
const mockKubeWatch = vi.mocked(kubeWatch);

function listOf(resourceVersion: string, items: Item[] = []): KubeList<Item> {
  return { apiVersion: "v1", kind: "ItemList", metadata: { resourceVersion }, items };
}

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useKubeWatch", () => {
  it("marks the watch connected once the stream opens, with zero events", async () => {
    mockKubeList.mockResolvedValue(listOf("1"));
    mockKubeWatch.mockImplementation((_path, _rv, _onEvent, _onError, onOpen) => {
      onOpen?.();
      return () => {};
    });

    const { result } = renderHook(() => useKubeWatch<Item>(["watch-open"], "/items"), { wrapper });

    await waitFor(() => expect(result.current.connectionStatus).toBe("connected"));
    expect(result.current.data?.items).toEqual([]);
  });

  it("patches the cached list on ADDED/MODIFIED/DELETED events", async () => {
    mockKubeList.mockResolvedValue(
      listOf("1", [{ metadata: { uid: "a", name: "a" }, value: "orig" }]),
    );
    let capturedOnEvent: ((event: WatchEvent<Item>) => void) | undefined;
    mockKubeWatch.mockImplementation((_path, _rv, onEvent) => {
      capturedOnEvent = onEvent;
      return () => {};
    });

    const key = ["watch-events"];
    renderHook(() => useKubeWatch<Item>(key, "/items"), { wrapper });

    await waitFor(() => expect(capturedOnEvent).toBeDefined());

    act(() => {
      capturedOnEvent?.({
        type: "ADDED",
        object: { metadata: { uid: "b", name: "b", resourceVersion: "2" }, value: "new" },
      });
    });
    await waitFor(() => {
      const data = queryClient.getQueryData<KubeList<Item>>(key);
      expect(data?.items.map((item) => item.metadata.uid)).toEqual(["a", "b"]);
    });

    act(() => {
      capturedOnEvent?.({
        type: "MODIFIED",
        object: { metadata: { uid: "a", name: "a", resourceVersion: "3" }, value: "changed" },
      });
    });
    await waitFor(() => {
      const data = queryClient.getQueryData<KubeList<Item>>(key);
      expect(data?.items.find((item) => item.metadata.uid === "a")?.value).toBe("changed");
    });

    act(() => {
      capturedOnEvent?.({
        type: "DELETED",
        object: { metadata: { uid: "b", name: "b", resourceVersion: "4" }, value: "new" },
      });
    });
    await waitFor(() => {
      const data = queryClient.getQueryData<KubeList<Item>>(key);
      expect(data?.items.map((item) => item.metadata.uid)).toEqual(["a"]);
    });
  });

  it("invalidates on a 410 and reconnects with the fresh resourceVersion, not the stale one", async () => {
    mockKubeList.mockResolvedValueOnce(listOf("1")).mockResolvedValueOnce(listOf("2"));

    let onErrorFn: ((err: Error) => void) | undefined;
    mockKubeWatch.mockImplementation((_path, _rv, _onEvent, onError) => {
      onErrorFn = onError;
      return () => {};
    });

    renderHook(() => useKubeWatch<Item>(["watch-410"], "/items"), { wrapper });

    await waitFor(() => expect(mockKubeWatch).toHaveBeenCalledTimes(1));
    expect(mockKubeWatch.mock.calls[0]?.[1]).toBe("1");

    const goneError = new KubeApiError({
      kind: "Status",
      apiVersion: "v1",
      status: "Failure",
      message: "Gone",
      reason: "Expired",
      code: 410,
    });

    act(() => {
      onErrorFn?.(goneError);
    });

    await waitFor(() => expect(mockKubeWatch).toHaveBeenCalledTimes(2));
    expect(mockKubeWatch.mock.calls[1]?.[1]).toBe("2");
  });

  it("stops reconnecting and falls back to polling after 3 consecutive failed attempts", async () => {
    vi.useFakeTimers();
    mockKubeList.mockResolvedValue(listOf("1"));
    mockKubeWatch.mockImplementation((_path, _rv, _onEvent, onError) => {
      onError(new Error("connection failed"));
      return () => {};
    });

    const { result } = renderHook(() => useKubeWatch<Item>(["watch-fallback"], "/items"), {
      wrapper,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(3);
    expect(result.current.connectionStatus).toBeUndefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(3);
  });

  it("falls back to polling when the stream opens then immediately ends with zero events", async () => {
    vi.useFakeTimers();
    mockKubeList.mockResolvedValue(listOf("1"));
    mockKubeWatch.mockImplementation((_path, _rv, _onEvent, onError, onOpen) => {
      onOpen?.();
      onError(new Error("watch stream ended"));
      return () => {};
    });

    const { result } = renderHook(() => useKubeWatch<Item>(["watch-immediate-end"], "/items"), {
      wrapper,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(3);
    expect(result.current.connectionStatus).toBeUndefined();

    const watchCallsAtFallback = mockKubeWatch.mock.calls.length;
    const listCallsAtFallback = mockKubeList.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(mockKubeWatch).toHaveBeenCalledTimes(watchCallsAtFallback);
    expect(mockKubeList.mock.calls.length).toBeGreaterThan(listCallsAtFallback);
  });

  it("skips the watch entirely and polls when watch is disabled", async () => {
    vi.useFakeTimers();
    mockKubeList.mockResolvedValue(listOf("1"));

    renderHook(() => useKubeWatch<Item>(["watch-disabled"], "/items", { watch: false }), {
      wrapper,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(mockKubeList).toHaveBeenCalledTimes(1);
    expect(mockKubeWatch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL);
    });
    expect(mockKubeList).toHaveBeenCalledTimes(2);
    expect(mockKubeWatch).not.toHaveBeenCalled();
  });
});
