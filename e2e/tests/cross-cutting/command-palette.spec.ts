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

import type { Page } from "@playwright/test";
import { test, expect } from "../../fixtures/base";

async function openCommandPalette(page: Page) {
  await page.getByRole("button", { name: /search resources/i }).click();
}

const PALETTE = "[cmdk-root]";
const INPUT = "input[placeholder*='Search pages']";
const ITEM = "[cmdk-item]";

test.describe("Command Palette", () => {
  test("opens via search button", async ({ page }) => {
    await page.goto("/");
    await openCommandPalette(page);
    await expect(page.locator(PALETTE)).toBeVisible();
    await expect(page.locator(INPUT)).toBeVisible();
  });

  test("filters items", async ({ page }) => {
    await page.goto("/");
    await openCommandPalette(page);
    await page.locator(INPUT).fill("tenant");
    await expect(page.locator(ITEM).first()).toBeVisible();
  });

  test("navigates to selection", async ({ page }) => {
    await page.goto("/");
    await openCommandPalette(page);
    await page.locator(INPUT).fill("Load Balancers");

    const item = page.locator(ITEM, { hasText: "Load Balancers" });
    await expect(item).toBeVisible();
    await item.click();
    await page.waitForURL(/\/load-balancers/);
  });
});
