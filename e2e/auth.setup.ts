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

import { test as setup, expect } from "@playwright/test";

const authFile = "e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const user = process.env.E2E_USER;
  const password = process.env.E2E_PASSWORD;

  await page.goto("/");

  // If we land on the dashboard directly, auth is disabled — just save state
  const isLoginPage = page.url().includes("/login");
  if (!isLoginPage) {
    await expect(page.locator("[data-testid='sidebar']")).toBeVisible({ timeout: 10000 });
    await page.context().storageState({ path: authFile });
    return;
  }

  // Auth is enabled — need credentials
  if (!user || !password) {
    throw new Error("Auth is enabled but E2E_USER and E2E_PASSWORD env vars are not set");
  }

  await expect(page.getByRole("heading", { name: "KubeLB" })).toBeVisible();
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

  await page.context().storageState({ path: authFile });
});
