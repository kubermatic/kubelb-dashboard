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

async function navigateAsCE(page: import("@playwright/test").Page, path: string) {
  await page.route("**/api/kube/apis/kubelb.k8c.io/v1alpha1/wafpolicies", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ kind: "Status", apiVersion: "v1", code: 404, status: "Failure" }),
      });
    }
    return route.continue();
  });

  await page.goto(path);
  await page.evaluate(() => localStorage.removeItem("kubelb-edition"));
  await page.reload();
  await expect(page.locator(selectors.sidebar)).toBeVisible({ timeout: 10000 });
}

test.describe("CE Smoke Tests", () => {
  test("WAF Policies nav hidden", async ({ page }) => {
    await navigateAsCE(page, "/");
    await expect(page.locator(selectors.sidebar).getByText("WAF Policies")).not.toBeVisible();
  });

  test("EE columns hidden in tenant table", async ({ page }) => {
    await navigateAsCE(page, "/tenants");
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible({ timeout: 10000 });
    await expect(table.getByText("LB Limit")).not.toBeVisible();
    await expect(table.getByText("GW Limit")).not.toBeVisible();
    await expect(table.getByText("Tunnel")).not.toBeVisible();
    await expect(table.getByText("Allowed Domains")).not.toBeVisible();
  });

  test("EE fields hidden in tenant form", async ({ page }) => {
    await navigateAsCE(page, "/tenants");
    await expect(
      page.locator(selectors.dataTable).or(page.getByText(/no tenants found/i)),
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /create tenant/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await expect(dialog.locator("#lb-limit")).not.toBeVisible();
    await expect(dialog.locator("#gw-limit")).not.toBeVisible();
  });

  test("tenant detail hides EE sections", async ({ page }) => {
    await navigateAsCE(page, "/tenants");
    const table = page.locator(selectors.dataTable);
    if (!(await waitForRows(table.locator("tbody tr")))) {
      test.skip();
      return;
    }
    const link = table.locator("tbody tr a").first();
    await link.click();
    await page.waitForURL(/\/tenants\/.+/);

    await expect(page.getByText("Tunnel")).not.toBeVisible();
    await expect(page.getByText("Allowed Domains")).not.toBeVisible();
  });
});
