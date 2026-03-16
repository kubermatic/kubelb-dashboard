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

test.describe("Tenant Detail Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tenants");
    const table = page.locator(selectors.dataTable);
    const firstLink = table.locator("tbody tr a").first();
    await expect(firstLink).toBeVisible({ timeout: 10000 });
    await firstLink.click();
    await page.waitForURL(/\/tenants\/.+/);
  });

  test("overview tab shows features section", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await expect(page.getByText("Layer 4")).toBeVisible();
    await expect(page.getByText("Ingress")).toBeVisible();
    await expect(page.getByText("Gateway API")).toBeVisible();
  });

  test("configuration tab loads", async ({ page }) => {
    await page.getByRole("tab", { name: /configuration/i }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });

  test("metadata tab loads", async ({ page }) => {
    await page.getByRole("tab", { name: /metadata/i }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });

  test("resource header has action buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: /yaml/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /kubeconfig/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /delete/i })).toBeVisible();
  });
});
