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

test.describe.serial("WAF Policy CRUD", () => {
  let policyName: string;

  test.afterAll(async ({ api }) => {
    for (const name of created) {
      await api.deleteWAFPolicy(name);
    }
  });

  test("validation rejects empty name", async ({ page }) => {
    await page.goto("/waf-policies");
    await page.getByRole("button", { name: /create/i }).click();
    const dialog = dialogByTitle(page, /create waf policy/i);
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(dialog.getByRole("alert")).toBeVisible();
  });

  test("create WAF policy", async ({ page, uniqueName }) => {
    policyName = uniqueName("waf");
    created.push(policyName);

    await page.goto("/waf-policies");
    await page.getByRole("button", { name: /create/i }).click();
    const dialog = dialogByTitle(page, /create waf policy/i);

    const nameInput = dialog.locator("input").first();
    await nameInput.fill(policyName);

    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
  });

  test("WAF policy appears in list", async ({ page }) => {
    await page.goto("/waf-policies");
    const table = page.locator(selectors.dataTable);
    await expect(table.getByText(policyName)).toBeVisible({ timeout: 15000 });
  });

  test("WAF policy detail page", async ({ page }) => {
    await page.goto(`/waf-policies/${policyName}`);
    await expect(page.locator(selectors.pageHeader)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("heading", { name: policyName })).toBeVisible();
  });

  test("edit WAF policy", async ({ page }) => {
    await page.goto(`/waf-policies/${policyName}`);
    await page.getByRole("button", { name: /edit/i }).click();
    const dialog = dialogByTitle(page, /edit waf policy/i);
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /save/i }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
  });

  test("delete WAF policy", async ({ page }) => {
    await page.goto(`/waf-policies/${policyName}`);
    await page.getByRole("button", { name: /delete/i }).click();
    const dialog = page.locator(selectors.deleteDialog);
    await expect(dialog).toBeVisible();

    await dialog.locator("#delete-confirmation").fill(policyName);
    await dialog.getByRole("button", { name: /^delete$/i }).click();

    await page.waitForURL("/waf-policies");
    created.splice(created.indexOf(policyName), 1);
  });

  test("duplicate label key detected", async ({ page, uniqueName }) => {
    const name = uniqueName("waf-dupe");
    await page.goto("/waf-policies");
    await page.getByRole("button", { name: /create/i }).click();
    const dialog = dialogByTitle(page, /create waf policy/i);

    await dialog.locator("input").first().fill(name);

    // Switch targeting to label selector
    await dialog.getByText("Mode", { exact: true }).locator("..").getByRole("combobox").click();
    await page.getByRole("option", { name: "Label Selector" }).click();

    // Fill duplicate keys
    const keyInputs = dialog.locator('[aria-label^="Label key"]');
    await keyInputs.nth(0).fill("app");
    const valueInputs = dialog.locator('[aria-label^="Label value"]');
    await valueInputs.nth(0).fill("test");

    // Second row should auto-appear
    await keyInputs.nth(1).fill("app");
    await valueInputs.nth(1).fill("other");

    await dialog.getByRole("button", { name: /^create$/i }).click();
    await expect(dialog.getByText(/duplicate key/i).first()).toBeVisible();
  });
});
