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
import { selectors, dialogByTitle, waitForMonaco } from "../../helpers/selectors";

const created: { namespace: string; name: string }[] = [];

async function setMonacoValue(page: import("@playwright/test").Page, value: string) {
  await page.evaluate((val) => {
    const editor = (
      window as never as {
        monaco: { editor: { getEditors: () => { setValue: (v: string) => void }[] } };
      }
    ).monaco?.editor?.getEditors?.()[0];
    if (editor) editor.setValue(val);
  }, value);
}

test.describe.serial("Sync Secret CRUD", () => {
  let secretName: string;
  let tenantName: string;
  let namespace: string;

  test("list page loads", async ({ page }) => {
    await page.goto("/sync-secrets");
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.locator(selectors.dataTable)).toBeVisible();
  });

  test("create sync secret via YAML editor", async ({ page, uniqueName, api }) => {
    tenantName = uniqueName("ss-tenant");
    secretName = uniqueName("secret");
    namespace = `tenant-${tenantName}`;

    await api.createTenant(tenantName);
    await page.waitForTimeout(5000);

    await page.goto("/sync-secrets");
    await page.getByRole("button", { name: /create sync secret/i }).click();
    const dialog = dialogByTitle(page, "Create Sync Secret");
    await expect(dialog).toBeVisible();

    const yamlContent = [
      "apiVersion: kubelb.k8c.io/v1alpha1",
      "kind: SyncSecret",
      "metadata:",
      `  name: ${secretName}`,
      `  namespace: ${namespace}`,
      "type: Opaque",
      "data: {}",
    ].join("\n");

    await waitForMonaco(dialog);
    await dialog.locator(".monaco-editor").click();
    await setMonacoValue(page, yamlContent);

    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    created.push({ namespace, name: secretName });
  });

  test("sync secret appears in list", async ({ page }) => {
    await page.goto("/sync-secrets");
    const table = page.locator(selectors.dataTable);
    const searchInput = page.getByPlaceholder(/search sync secrets/i);
    await searchInput.fill(secretName);
    await expect(table.getByText(secretName)).toBeVisible({ timeout: 15000 });
  });

  test("sync secret detail page loads", async ({ page }) => {
    await page.goto(`/sync-secrets/${namespace}/${secretName}`);
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.getByRole("heading", { name: secretName })).toBeVisible();
  });

  test("edit sync secret", async ({ page }) => {
    await page.goto(`/sync-secrets/${namespace}/${secretName}`);
    await page.getByRole("button", { name: /edit/i }).click();
    const dialog = dialogByTitle(page, /edit syncsecret/i);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /save/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
  });

  test("delete sync secret", async ({ page }) => {
    await page.goto(`/sync-secrets/${namespace}/${secretName}`);
    await page.getByRole("button", { name: /delete/i }).click();
    const dialog = page.locator(selectors.deleteDialog);
    await expect(dialog).toBeVisible();

    await dialog.locator("#delete-confirmation").fill(secretName);
    await dialog.getByRole("button", { name: /^delete$/i }).click();

    await page.waitForURL("/sync-secrets");
    created.splice(
      created.findIndex((c) => c.name === secretName),
      1,
    );
  });

  test.afterAll(async ({ api }) => {
    for (const { namespace: ns, name } of created) {
      await api.deleteSyncSecret(ns, name);
    }
    if (tenantName) {
      await api.deleteTenant(tenantName);
    }
  });
});
