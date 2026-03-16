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

test.describe("Tenant Selector", () => {
  test("sync secrets page has tenant selector", async ({ page }) => {
    await page.goto("/sync-secrets");
    await expect(page.locator(selectors.dataTable)).toBeVisible();
    await expect(page.getByText("All Tenants")).toBeVisible();
  });

  test("tenant selector lists tenants", async ({ page }) => {
    await page.goto("/sync-secrets");
    await page.getByText("All Tenants").click();
    const options = page.getByRole("option");
    await expect(options.first()).toBeVisible();
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(2); // "All Tenants" + at least 1 tenant
  });

  test("selecting tenant filters results", async ({ page }) => {
    await page.goto("/sync-secrets");
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible();

    // Select a specific tenant
    await page.getByText("All Tenants").click();
    const options = page.getByRole("option");
    if (!(await waitForRows(options, 5000))) {
      test.skip();
      return;
    }
    const count = await options.count();
    if (count < 2) {
      test.skip();
      return;
    }
    await options.nth(1).click();

    // Verify it changed from "All Tenants"
    await expect(page.getByText("All Tenants")).not.toBeVisible();
  });
});
