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
import { selectors, waitForRows } from "../../helpers/selectors";

test.describe("Routes List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/routes");
  });

  test("header and table renders", async ({ page }) => {
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Routes" })).toBeVisible();
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible();
  });

  test("row click navigates to detail", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    if (!(await waitForRows(table.locator("tbody tr")))) {
      test.skip();
      return;
    }
    const firstLink = table.locator("tbody tr a").first();
    await firstLink.click();
    await page.waitForURL(/\/routes\/[^/]+\/.+/);
  });

  test("detail has YAML viewer", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    if (!(await waitForRows(table.locator("tbody tr")))) {
      test.skip();
      return;
    }
    const firstLink = table.locator("tbody tr a").first();
    await firstLink.click();
    await page.waitForURL(/\/routes\/[^/]+\/.+/);
    await page.getByRole("button", { name: /view yaml/i }).click();
    await expect(page.locator(selectors.yamlViewer)).toBeVisible();
  });
});
