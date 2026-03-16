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
import { selectors, waitForMonaco } from "../../helpers/selectors";

test.describe("YAML Viewer", () => {
  test("opens from row actions and shows YAML content", async ({ page }) => {
    await page.goto("/tenants");
    const table = page.locator(selectors.dataTable);
    await expect(table.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

    // Open row actions menu on first row
    const firstRow = table.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: /open actions/i }).click();
    await page.getByRole("menuitem", { name: /view yaml/i }).click();

    const viewer = page.locator(selectors.yamlViewer);
    await expect(viewer).toBeVisible();
    await waitForMonaco(viewer);
    await expect(viewer.getByText("apiVersion", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(viewer.getByText("metadata", { exact: true })).toBeVisible();
  });
});
