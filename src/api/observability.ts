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

export interface ObservabilitySource {
  available: boolean;
  source: string | null;
}

export interface ObservabilitySources {
  metrics: ObservabilitySource;
  traffic: ObservabilitySource;
  tracing: ObservabilitySource;
}

const UNAVAILABLE: ObservabilitySources = {
  metrics: { available: false, source: null },
  traffic: { available: false, source: null },
  tracing: { available: false, source: null },
};

export async function fetchObservabilitySources(): Promise<ObservabilitySources> {
  try {
    const res = await fetch("/api/observability/sources", { credentials: "include" });
    if (!res.ok) return UNAVAILABLE;
    return (await res.json()) as ObservabilitySources;
  } catch {
    return UNAVAILABLE;
  }
}
