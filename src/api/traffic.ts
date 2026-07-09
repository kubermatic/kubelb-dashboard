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

export interface TrafficSources {
  hubble: { available: boolean; source: string | null };
}

export interface TrafficEndpoint {
  name: string;
  namespace: string;
  kind: string;
}

export interface TrafficNode extends TrafficEndpoint {
  id: string;
}

export interface TrafficEdge {
  from: string;
  to: string;
  connections: number;
  verdict: string;
}

export interface TrafficGraphData {
  nodes: TrafficNode[];
  edges: TrafficEdge[];
}

export interface L7Http {
  method: string;
  path: string;
  status?: number;
}

export interface TrafficFlow {
  source: TrafficEndpoint;
  destination: TrafficEndpoint;
  protocol: string;
  port: number;
  verdict: string;
  l7?: string;
  l7http?: L7Http;
  time: string;
}

export const TRAFFIC_WINDOWS = ["1m", "5m", "15m", "1h"] as const;
export type TrafficWindow = (typeof TRAFFIC_WINDOWS)[number];
export const DEFAULT_TRAFFIC_WINDOW: TrafficWindow = "5m";

const UNAVAILABLE: TrafficSources = { hubble: { available: false, source: null } };

export async function fetchTrafficSources(): Promise<TrafficSources> {
  try {
    const res = await fetch("/api/traffic/sources", { credentials: "include" });
    if (!res.ok) return UNAVAILABLE;
    return (await res.json()) as TrafficSources;
  } catch {
    return UNAVAILABLE;
  }
}

export async function fetchTrafficGraph(
  window: TrafficWindow,
  namespace?: string,
): Promise<TrafficGraphData> {
  const ns = namespace ? `&namespace=${encodeURIComponent(namespace)}` : "";
  const res = await fetch(`/api/traffic/graph?window=${window}${ns}`, { credentials: "include" });
  if (!res.ok) throw new Error(`traffic graph ${String(res.status)}`);
  return (await res.json()) as TrafficGraphData;
}

export async function fetchTrafficFlows(window: TrafficWindow): Promise<TrafficFlow[]> {
  const res = await fetch(`/api/traffic/flows?window=${window}`, { credentials: "include" });
  if (!res.ok) throw new Error(`traffic flows ${String(res.status)}`);
  const body = (await res.json()) as { flows: TrafficFlow[] };
  return body.flows;
}
