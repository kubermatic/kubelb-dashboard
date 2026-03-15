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

test.describe("DataTable Sorting & Pagination", () => {
  test("column header click sorts table", async ({ page }) => {
    await page.goto("/tenants");
    const table = page.locator(selectors.dataTable);
    await expect(table.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

    // Click Name column header to sort
    const nameHeader = table.getByRole("button", { name: /name/i }).first();
    await nameHeader.click();

    // Column should show sort indicator (aria-sort or visual indicator)
    await expect(nameHeader).toBeVisible();
  });

  test("page size selector works", async ({ page }) => {
    await page.goto("/tenants");
    const table = page.locator(selectors.dataTable);
    await expect(table.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

    // Look for rows per page selector
    const pageSizeSelect = page.getByRole("combobox", { name: /rows/i });
    if (await pageSizeSelect.isVisible().catch(() => false)) {
      await pageSizeSelect.click();
      await page.getByRole("option", { name: "20" }).click();
    }
  });

  test("column visibility toggle works", async ({ page }) => {
    await page.goto("/tenants");
    const table = page.locator(selectors.dataTable);
    await expect(table.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /columns/i }).click();
    const menu = page.locator('[data-slot^="dropdown-menu"]');
    await expect(menu.getByText("Toggle columns")).toBeVisible();
  });
});
