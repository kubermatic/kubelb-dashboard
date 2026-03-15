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

test.describe("WAF Policy Detail Tabs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/waf-policies");
    const table = page.locator(selectors.dataTable);
    if (!(await waitForRows(table.locator("tbody tr")))) {
      test.skip();
      return;
    }
    await table.locator("tbody tr a").first().click();
    await page.waitForURL(/\/waf-policies\/.+/);
  });

  test("overview tab shows targeting and configuration", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await expect(page.getByText("Targeting")).toBeVisible();
    await expect(page.getByText("Failure Mode")).toBeVisible();
  });

  test("metadata tab loads", async ({ page }) => {
    await page.getByRole("tab", { name: /metadata/i }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });

  test("action buttons visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /yaml/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /edit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /delete/i })).toBeVisible();
  });
});
