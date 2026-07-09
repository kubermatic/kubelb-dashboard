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

import { afterAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";
import type { KubeProxyConfig } from "./kube-config.js";

const config: KubeProxyConfig = { upstream: "http://127.0.0.1:1", rejectUnauthorized: false };

function makeApp(watchEnabled?: boolean): Promise<FastifyInstance> {
  return buildApp({ config, authEnabled: false, watchEnabled, logger: false });
}

describe("/api/config watchEnabled", () => {
  const apps: FastifyInstance[] = [];
  afterAll(async () => {
    await Promise.all(apps.map((a) => a.close()));
  });

  it("reports watchEnabled: false by default", async () => {
    const app = await makeApp();
    apps.push(app);
    const res = await app.inject({ method: "GET", url: "/api/config" });
    expect(res.json()).toMatchObject({ watchEnabled: false });
  });

  it("reports watchEnabled: true when enabled", async () => {
    const app = await makeApp(true);
    apps.push(app);
    const res = await app.inject({ method: "GET", url: "/api/config" });
    expect(res.json()).toMatchObject({ watchEnabled: true });
  });
});
