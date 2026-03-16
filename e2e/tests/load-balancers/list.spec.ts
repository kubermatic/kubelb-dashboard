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

test.describe("Load Balancers List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/load-balancers");
  });

  test("header renders", async ({ page }) => {
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Load Balancers" })).toBeVisible();
  });

  test("table has columns and rows", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible();
    await expect(table.locator("thead th")).not.toHaveCount(0);
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  });

  test("row click navigates to detail", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    const firstLink = table.locator("tbody tr a").first();
    await expect(firstLink).toBeVisible({ timeout: 10000 });
    await firstLink.click();
    await page.waitForURL(/\/load-balancers\/.+\/.+/);
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
  });
});
