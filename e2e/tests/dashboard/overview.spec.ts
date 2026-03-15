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

import { test, expect } from "../../fixtures/base";
import { selectors } from "../../helpers/selectors";

test.describe("Dashboard Overview", () => {
  test("page renders with heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });

  test("resource cards visible", async ({ page }) => {
    await page.goto("/");
    const main = page.getByRole("main");
    await expect(main.getByText("Tenants")).toBeVisible();
    await expect(main.getByText("Load Balancers")).toBeVisible();
  });

  test("sidebar nav items visible", async ({ page }) => {
    await page.goto("/");
    const sidebar = page.locator(selectors.sidebar);
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByText("Overview")).toBeVisible();
    await expect(sidebar.getByText("Tenants")).toBeVisible();
    await expect(sidebar.getByText("Load Balancers")).toBeVisible();
    await expect(sidebar.getByText("Routes")).toBeVisible();
    await expect(sidebar.getByText("Sync Secrets")).toBeVisible();
    await expect(sidebar.getByText("Envoy Proxy")).toBeVisible();
    await expect(sidebar.getByText("Configuration")).toBeVisible();
    await expect(sidebar.getByText("WAF Policies")).toBeVisible();
  });
});
