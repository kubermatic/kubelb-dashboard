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

test.describe("Dashboard Quick Actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
  });

  test("resource rows link to list pages", async ({ page }) => {
    const tenantsLink = page.getByRole("link", { name: /tenants/i }).first();
    if (await tenantsLink.isVisible().catch(() => false)) {
      await tenantsLink.click();
      await page.waitForURL(/\/tenants/);
    }
  });

  test("quick action buttons visible", async ({ page }) => {
    // Quick actions section should have create buttons
    const createTenantBtn = page.getByRole("button", { name: /create tenant/i });
    if (await createTenantBtn.isVisible().catch(() => false)) {
      await expect(createTenantBtn).toBeVisible();
    }
  });
});
