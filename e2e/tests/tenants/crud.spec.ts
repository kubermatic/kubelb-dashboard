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
import { selectors, dialogByTitle } from "../../helpers/selectors";

const created: string[] = [];

test.describe.serial("Tenant CRUD", () => {
  let tenantName: string;

  test.beforeAll(async () => {
    // nothing — names generated per test
  });

  test.afterAll(async ({ api }) => {
    for (const name of created) {
      await api.deleteTenant(name);
    }
  });

  test("validation rejects invalid name", async ({ page }) => {
    await page.goto("/tenants");
    await page.getByRole("button", { name: /create tenant/i }).click();
    const dialog = dialogByTitle(page, "Create Tenant");
    await expect(dialog).toBeVisible();

    const nameInput = dialog.locator("#tenant-name");
    await nameInput.fill("INVALID_NAME!");
    await nameInput.blur();
    await expect(dialog.getByText(/lowercase alphanumeric/i)).toBeVisible();
  });

  test("create tenant via form", async ({ page, uniqueName }) => {
    tenantName = uniqueName("tenant");
    created.push(tenantName);

    await page.goto("/tenants");
    await page.getByRole("button", { name: /create tenant/i }).click();
    const dialog = dialogByTitle(page, "Create Tenant");
    await expect(dialog).toBeVisible();

    await dialog.locator("#tenant-name").fill(tenantName);
    await dialog.getByRole("button", { name: /create tenant/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible({ timeout: 10000 });
  });

  test("tenant appears in list", async ({ page }) => {
    await page.goto("/tenants");
    const table = page.locator(selectors.dataTable);
    const searchInput = page.getByPlaceholder(/search tenants/i);
    await searchInput.fill(tenantName);
    await expect(table.getByText(tenantName)).toBeVisible({ timeout: 15000 });
  });

  test("tenant detail page loads", async ({ page }) => {
    await page.goto(`/tenants/${tenantName}`);
    await expect(page.locator(selectors.pageHeader)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: tenantName })).toBeVisible();
  });

  test("tenant detail has tabs and YAML", async ({ page }) => {
    await page.goto(`/tenants/${tenantName}`);
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.getByRole("tab", { name: /overview/i })).toBeVisible();
    await page.getByRole("button", { name: /yaml/i }).click();
    await expect(page.locator(selectors.yamlViewer)).toBeVisible();
  });

  test("edit tenant via YAML editor", async ({ page }) => {
    await page.goto(`/tenants/${tenantName}`);
    await page.getByRole("button", { name: /edit/i }).click();
    const dialog = dialogByTitle(page, /edit tenant/i);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /save/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
  });

  test("delete tenant", async ({ page }) => {
    await page.goto(`/tenants/${tenantName}`);
    await page.getByRole("button", { name: /delete/i }).click();
    const dialog = page.locator(selectors.deleteDialog);
    await expect(dialog).toBeVisible();

    await dialog.locator("#delete-confirmation").fill(tenantName);
    await dialog.getByRole("button", { name: /^delete$/i }).click();

    await page.waitForURL("/tenants");
    created.splice(created.indexOf(tenantName), 1);
  });

  test("bulk delete tenants", async ({ page, api, uniqueName }) => {
    const name1 = uniqueName("bulk1");
    const name2 = uniqueName("bulk2");
    created.push(name1, name2);

    await api.createTenant(name1);
    await api.createTenant(name2);

    await page.goto("/tenants");
    const table = page.locator(selectors.dataTable);
    await expect(table.locator("tbody tr").first()).toBeVisible({ timeout: 10000 });

    // Select rows via checkboxes
    const row1 = table.locator("tbody tr", { hasText: name1 });
    const row2 = table.locator("tbody tr", { hasText: name2 });
    await row1.locator('[aria-label="Select row"]').click();
    await row2.locator('[aria-label="Select row"]').click();

    await page.getByRole("button", { name: /delete.*selected/i }).click();

    const dialog = page.locator(selectors.bulkDeleteDialog);
    await expect(dialog).toBeVisible();
    await dialog.locator("#bulk-delete-confirmation").fill("confirm");
    await dialog.getByRole("button", { name: /delete/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    created.splice(created.indexOf(name1), 1);
    created.splice(created.indexOf(name2), 1);
  });
});
