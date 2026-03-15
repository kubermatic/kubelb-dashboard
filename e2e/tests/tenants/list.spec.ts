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

test.describe("Tenants List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tenants");
  });

  test("header and create button visible", async ({ page }) => {
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tenants" })).toBeVisible();
    await expect(page.getByRole("button", { name: /create tenant/i })).toBeVisible();
  });

  test("table columns visible", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible();
    await expect(table.getByText("Name")).toBeVisible();
    await expect(table.getByText("Status")).toBeVisible();
  });

  test("search filters table", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    await expect(table.locator("tbody tr a").first()).toBeVisible({ timeout: 10000 });
    const searchInput = page.getByPlaceholder(/search tenants/i);
    await searchInput.fill("nonexistent-tenant-xyz-123");
    await expect(table.getByText(/no matching results/i)).toBeVisible({ timeout: 5000 });
  });

  test("row click navigates to detail", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    const firstLink = table.locator("tbody tr a").first();
    await expect(firstLink).toBeVisible({ timeout: 10000 });
    await firstLink.click();
    await page.waitForURL(/\/tenants\/.+/);
  });
});
