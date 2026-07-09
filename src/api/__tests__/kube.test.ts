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
import { getCachedAppConfig } from "@/api/config";
import { kubeCreate, kubeUpdate, kubeDelete, kubePatch, KubeApiError } from "../kube";

vi.mock("@/api/config", () => ({ getCachedAppConfig: vi.fn() }));

const mockGetCached = vi.mocked(getCachedAppConfig);

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("kube write guard", () => {
  describe("when read-only", () => {
    beforeEach(() => {
      mockGetCached.mockReturnValue({ authEnabled: false, readOnly: true, watchEnabled: false });
    });

    it("rejects every mutating call with a 403 KubeApiError and never calls fetch", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const calls = [
        kubeCreate("/x", {}),
        kubeUpdate("/x", {}),
        kubeDelete("/x"),
        kubePatch("/x", {}),
      ];

      for (const call of calls) {
        await expect(call).rejects.toMatchObject({ code: 403 });
        await expect(call).rejects.toBeInstanceOf(KubeApiError);
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("when not read-only", () => {
    beforeEach(() => {
      mockGetCached.mockReturnValue({ authEnabled: false, readOnly: false, watchEnabled: false });
    });

    it("performs the request", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: true }) } as Response);

      await expect(kubeCreate("/x", {})).resolves.toEqual({ ok: true });
      expect(fetchSpy).toHaveBeenCalledOnce();
    });
  });
});
