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

import type { APIRequestContext, Page } from "@playwright/test";
import { test, expect } from "../../fixtures/base";
import { dialogByTitle, selectors, toastMessage } from "../../helpers/selectors";

const INSIGHTS_API = "/api/kube/apis/kubelb.k8c.io/v1alpha1";

interface InsightItem {
  metadata: { name: string; namespace: string };
  spec: { check: string; triage?: { state: string } };
}

async function listInsights(request: APIRequestContext): Promise<InsightItem[] | null> {
  const res = await request.get(`${INSIGHTS_API}/insights`);
  if (!res.ok()) return null;
  const body = (await res.json()) as { items: InsightItem[] };
  return body.items;
}

async function clearTriage(request: APIRequestContext, insight: InsightItem) {
  await request.patch(
    `${INSIGHTS_API}/namespaces/${insight.metadata.namespace}/insights/${insight.metadata.name}`,
    {
      headers: { "Content-Type": "application/merge-patch+json" },
      data: { spec: { triage: null } },
    },
  );
}

async function openTriageDialog(page: Page, insight: InsightItem) {
  await page.goto(`/insights/${insight.metadata.namespace}/${insight.metadata.name}`);
  await page.getByRole("button", { name: /triage/i }).click();
  const dialog = dialogByTitle(page, new RegExp(`triage ${insight.spec.check}`, "i"));
  await expect(dialog).toBeVisible();
  return dialog;
}

// The insights CRD ships with the insights engine; skip everything when the
// cluster under test does not have it installed.
test.describe.serial("Insight triage", () => {
  let subject: InsightItem;

  test.beforeAll(async ({ request }) => {
    const items = await listInsights(request);
    test.skip(items === null, "insights CRD not installed on this cluster");
    test.skip(items !== null && items.length === 0, "no findings to triage on this cluster");
    subject = (items ?? []).find((i) => !i.spec.triage) ?? (items ?? [])[0];
  });

  test.afterAll(async ({ request }) => {
    const items = await listInsights(request);
    if (items === null || items.length === 0) return;
    await clearTriage(request, subject);
  });

  test("findings are listed fleet-wide", async ({ page }) => {
    await page.goto("/insights?pageSize=50");
    const table = page.locator(selectors.dataTable);
    await expect(table).toBeVisible();
    await expect(table.getByText(subject.spec.check).first()).toBeVisible({ timeout: 15000 });
  });

  test("dismiss requires a reason and writes the triage", async ({ page }) => {
    const dialog = await openTriageDialog(page, subject);

    await dialog.getByLabel("Decision").click();
    await page.getByRole("option", { name: "Dismiss" }).click();

    // The form models the CRD's iff-rule: no reason, no submit.
    await expect(dialog.getByRole("button", { name: "Apply" })).toBeDisabled();

    await dialog.getByLabel("Reason").click();
    await page.getByRole("option", { name: "Working as intended" }).click();
    await dialog.getByRole("button", { name: "Apply" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("triage-state")).toHaveText("Dismissed");
    await expect(page.getByTestId("triage-reason")).toHaveText("Working as intended");
  });

  test("reopen clears the triage", async ({ page }) => {
    // Acknowledge first so the finding is triaged regardless of what earlier
    // tests or backends left behind, then reopen it.
    let dialog = await openTriageDialog(page, subject);
    await dialog.getByLabel("Decision").click();
    await page.getByRole("option", { name: "Acknowledge" }).click();
    await dialog.getByRole("button", { name: "Apply" }).click();
    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("triage-state")).toHaveText("Acknowledged");

    await page.getByRole("button", { name: /triage/i }).click();
    dialog = dialogByTitle(page, new RegExp(`triage ${subject.spec.check}`, "i"));
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("Decision").click();
    await page.getByRole("option", { name: "Reopen" }).click();
    await dialog.getByRole("button", { name: "Apply" }).click();

    await expect(dialog).not.toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("triage-state")).toHaveText(/not triaged/i);
  });

  test("a rejected triage patch surfaces the API error and keeps the dialog open", async ({
    page,
  }) => {
    // Force the API server's answer to a patch the CRD would reject, so the
    // rejection path is deterministic regardless of backend.
    await page.addInitScript(() => {
      const original = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : (input as Request).url;
        const method = init?.method ?? (input instanceof Request ? input.method : "GET");
        if (method === "PATCH" && url.includes("/insights/")) {
          return new Response(
            JSON.stringify({
              kind: "Status",
              apiVersion: "v1",
              status: "Failure",
              reason: "Invalid",
              code: 422,
              message:
                "Insight is invalid: spec.triage: reason is required if and only if state is Dismissed",
            }),
            { status: 422, headers: { "Content-Type": "application/json" } },
          );
        }
        return original(input, init);
      };
    });

    const dialog = await openTriageDialog(page, subject);
    await dialog.getByRole("button", { name: "Apply" }).click();

    await expect(toastMessage(page, "reason is required")).toBeVisible({ timeout: 15000 });
    await expect(dialog).toBeVisible();
  });
});
