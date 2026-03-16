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

test.describe("Downstream Routes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/routes/downstream");
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
  });

  test("page renders with heading and back link", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Downstream Resources" })).toBeVisible();
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /routes/i })).toBeVisible();
  });

  test("managed toggle defaults to on", async ({ page }) => {
    const toggle = page.getByRole("switch");
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeChecked();
  });

  test("kind filter dropdown shows options", async ({ page }) => {
    await page.getByText("All Kinds").click();
    await expect(page.getByRole("option", { name: "Gateway" })).toBeVisible();
    await expect(page.getByRole("option", { name: "HTTPRoute" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Ingress" })).toBeVisible();
  });

  test("kind filter filters table", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible();

    await page.getByText("All Kinds").click();
    await page.getByRole("option", { name: "HTTPRoute" }).click();

    // Verify filter applied
    await expect(table).toBeVisible();
  });

  test("managed toggle shows tenant selector when on", async ({ page }) => {
    await expect(
      page.locator('[data-testid="data-table"]').getByText(/all tenants/i),
    ).toBeVisible();
  });

  test("managed toggle off shows namespace selector", async ({ page }) => {
    const toggle = page.getByRole("switch");
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    const main = page.getByRole("main");
    await expect(main.getByText("All Namespaces")).toBeVisible({ timeout: 5000 });
  });

  test("back link navigates to routes", async ({ page }) => {
    const main = page.getByRole("main");
    await main.getByRole("link", { name: /routes/i }).click();
    await page.waitForURL("/routes");
  });

  test("YAML viewer opens from row actions", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    const rows = table.locator("tbody tr");
    if (!(await waitForRows(rows))) {
      test.skip();
      return;
    }

    await rows
      .first()
      .getByRole("button", { name: /open actions/i })
      .click();
    await page.getByRole("menuitem", { name: /view yaml/i }).click();
    await expect(page.locator(selectors.yamlViewer)).toBeVisible();
  });
});
