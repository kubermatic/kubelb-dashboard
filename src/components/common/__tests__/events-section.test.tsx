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

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventsSection } from "../events-section";
import type { KubeEvent } from "@/types/kubernetes";

interface UseEventsResult {
  data?: { items: KubeEvent[] };
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const mockUseEvents = vi.fn<() => UseEventsResult>();
vi.mock("@/hooks/use-events", () => ({ useEvents: () => mockUseEvents() }));

describe("EventsSection", () => {
  it("shows the empty state when there are no events", () => {
    mockUseEvents.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<EventsSection namespace="tenant-primary" name="my-lb" />);
    expect(screen.getByText("No events")).toBeInTheDocument();
  });

  it("renders a fixture reason and warning styling", () => {
    const events: KubeEvent[] = [
      {
        metadata: { name: "evt-1", namespace: "tenant-primary" },
        type: "Warning",
        reason: "EndpointNotReady",
        message: "Endpoint address is not yet reachable",
        count: 1,
        lastTimestamp: "2026-03-13T07:53:20Z",
        involvedObject: { kind: "LoadBalancer", name: "my-lb", namespace: "tenant-primary" },
      },
    ];
    mockUseEvents.mockReturnValue({
      data: { items: events },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<EventsSection namespace="tenant-primary" name="my-lb" />);
    expect(screen.getByText("EndpointNotReady")).toBeInTheDocument();
    expect(screen.getByText("Warning")).toBeInTheDocument();
  });
});
