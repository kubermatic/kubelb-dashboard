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

test.describe("WAF Policies List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/waf-policies");
  });

  test("header and create button visible", async ({ page }) => {
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
    await expect(page.getByRole("heading", { name: "WAF Policies" })).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible();
  });

  test("table renders", async ({ page }) => {
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible();
  });
});
