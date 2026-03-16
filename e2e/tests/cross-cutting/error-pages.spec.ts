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

test.describe("Error & Not Found Pages", () => {
  test("404 page for unknown route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page.getByRole("link", { name: /go home/i })).toBeVisible();
  });

  test("resource not found for nonexistent tenant", async ({ page }) => {
    await page.goto("/tenants/e2e-nonexistent-tenant-xyz-999");
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/does not exist or has been deleted/i)).toBeVisible();
  });

  test("resource not found for nonexistent load balancer", async ({ page }) => {
    await page.goto("/load-balancers/default/e2e-nonexistent-lb-xyz-999");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: /not found/i })).toBeVisible({ timeout: 30000 });
  });

  test("resource not found for nonexistent WAF policy", async ({ page }) => {
    await page.goto("/waf-policies/e2e-nonexistent-waf-xyz-999");
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { name: /not found/i })).toBeVisible({ timeout: 30000 });
  });

  test("404 back link navigates home", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await page.getByRole("link", { name: /go home/i }).click();
    await page.waitForURL("/");
  });

  test("resource not found back link navigates to list", async ({ page }) => {
    await page.goto("/tenants/e2e-nonexistent-tenant-xyz-999");
    await expect(page.getByRole("heading", { name: /not found/i })).toBeVisible({ timeout: 30000 });
    const main = page.getByRole("main");
    await main.getByRole("link", { name: /tenants/i }).click();
    await page.waitForURL("/tenants");
  });
});
