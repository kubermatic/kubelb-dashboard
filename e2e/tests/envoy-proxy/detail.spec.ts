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

test.describe("Envoy Proxy Detail", () => {
  test("navigates to detail and shows content", async ({ page }) => {
    await page.goto("/envoy-proxy");
    const table = page.locator(selectors.dataTable);
    const rows = table.locator("tbody tr");
    if (!(await waitForRows(rows))) {
      test.skip();
      return;
    }

    await rows.first().locator("a").first().click();
    await page.waitForURL(/\/envoy-proxy\/.+\/.+/);
    await expect(page.locator(selectors.pageHeader)).toBeVisible();
  });
});
