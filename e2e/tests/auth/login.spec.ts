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

import { test, expect } from "@playwright/test";

// Auth tests are skipped until auth infra is available.
// See: https://github.com/ahmedwaleedmalik/kubelb-dashboard/issues/TBD
test.describe.skip("Login", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "KubeLB" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("unauthenticated user redirected to /login", async ({ page }) => {
    await page.goto("/tenants");
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: "KubeLB" })).toBeVisible();
  });

  test("successful login redirects to /", async ({ page }) => {
    const user = process.env.E2E_USER;
    const password = process.env.E2E_PASSWORD;
    if (!user || !password) {
      test.skip();
      return;
    }

    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/auth\/|\/dex\//);

    const loginInput = page.locator("#login");
    if (await loginInput.isVisible({ timeout: 5000 })) {
      await loginInput.fill(user);
      await page.locator("#password").fill(password);
      await page.getByRole("button", { name: /log\s*in|sign\s*in|submit/i }).click();
    }

    const grantButton = page.getByRole("button", { name: /grant|approve|allow/i });
    if (await grantButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await grantButton.click();
    }

    await page.waitForURL("/");
    await expect(page.locator("[data-testid='sidebar']")).toBeVisible({ timeout: 10000 });
  });
});
