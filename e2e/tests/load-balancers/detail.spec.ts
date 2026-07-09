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

test.describe("Load Balancer Detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/load-balancers");
    const table = page.locator(selectors.dataTable);
    const firstLink = table.locator("tbody tr a").first();
    await expect(firstLink).toBeVisible({ timeout: 10000 });
    await firstLink.click();
    await page.waitForURL(/\/load-balancers\/.+\/.+/);
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
  });

  test("resource header visible", async ({ page }) => {
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
  });

  test("YAML viewer opens and closes", async ({ page }) => {
    await page.getByRole("button", { name: /view yaml/i }).click();
    const viewer = page.locator(selectors.yamlViewer);
    await expect(viewer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).not.toBeVisible();
  });

  test("events section shows either events or an empty state", async ({ page }) => {
    const eventsCard = page.locator('[data-slot="card"]').filter({ hasText: "Events" });
    await expect(eventsCard).toBeVisible();

    const rows = eventsCard.locator("tbody tr");
    const hasRows = (await rows.count()) > 0;

    if (hasRows) {
      await expect(rows.first().locator("td").nth(1)).not.toHaveText("");
    } else {
      await expect(eventsCard.getByText("No events")).toBeVisible();
    }
  });
});
