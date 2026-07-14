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

// Keep the filename outside Vitest's default discovery pattern.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { canonicalJson, createManifest, validateManifest } from "./release-manifest.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;
const cli = fileURLToPath(new URL("./release-manifest.mjs", import.meta.url));

function values() {
  const apiImageRef = `quay.io/kubermatic/kubelb-dashboard-api:v1.2.3@${digest("b")}`;
  const dashboardImageRef = `quay.io/kubermatic/kubelb-dashboard:v1.2.3@${digest("a")}`;
  const helmChartRef = `oci://quay.io/kubermatic/helm-charts/kubelb-dashboard:1.2.3@${digest("e")}`;
  return {
    "api-image-digest": digest("b"),
    "api-image-ref": apiImageRef,
    "api-provenance-ref": apiImageRef,
    "api-sbom-amd64-digest": digest("d"),
    "api-sbom-arm64-digest": digest("e"),
    "api-sbom-ref": apiImageRef,
    "dashboard-image-digest": digest("a"),
    "dashboard-image-ref": dashboardImageRef,
    "dashboard-provenance-ref": dashboardImageRef,
    "dashboard-sbom-amd64-digest": digest("c"),
    "dashboard-sbom-arm64-digest": digest("d"),
    "dashboard-sbom-ref": dashboardImageRef,
    "github-run-attempt": "1",
    "github-run-id": "123",
    "github-run-url": "https://github.com/kubermatic/kubelb-dashboard/actions/runs/123",
    "github-workflow-ref":
      "kubermatic/kubelb-dashboard/.github/workflows/publish.yml@refs/tags/v1.2.3",
    "helm-chart-digest": digest("e"),
    "helm-chart-provenance-ref": helmChartRef,
    "helm-chart-ref": helmChartRef,
    output: "unused.json",
    "source-commit": "f".repeat(40),
    "source-repository": "https://github.com/kubermatic/kubelb-dashboard",
    tag: "v1.2.3",
    version: "1.2.3",
  };
}

test("validates a complete release manifest", () => {
  assert.deepEqual(validateManifest(createManifest(values())), []);
});

test("canonical JSON is stable regardless of object insertion order", () => {
  const manifest = createManifest(values());
  const reversed = Object.fromEntries(Object.entries(manifest).reverse());
  assert.equal(canonicalJson(reversed), canonicalJson(manifest));
  assert.match(canonicalJson(manifest), /\n$/);
});

test("rejects version and artifact tag mismatches", () => {
  const manifest = createManifest(values());
  manifest.release.tag = "v1.2.4";
  manifest.artifacts.helmChart.ref = manifest.artifacts.helmChart.ref.replace(":1.2.3@", ":1.2.4@");
  const errors = validateManifest(manifest);
  assert(errors.includes("release.tag must be v followed by release.version"));
  assert(errors.some((error) => error.startsWith("artifacts.helmChart.ref must end")));
});

test("rejects malformed and unbound digests", () => {
  const manifest = createManifest(values());
  manifest.artifacts.apiImage.digest = "sha256:ABC";
  manifest.sboms.apiImage[0].digest = "sha256:ABC";
  const errors = validateManifest(manifest);
  assert(errors.includes("artifacts.apiImage.digest must be a lowercase sha256 digest"));
  assert(errors.includes("sboms.apiImage[0].digest must be a lowercase sha256 digest"));
  assert(errors.some((error) => error.startsWith("artifacts.apiImage.ref must end")));
});

test("rejects SBOM and provenance refs for different subjects", () => {
  const bindings = [
    ["sboms", "apiImage", 0, "apiImage"],
    ["sboms", "dashboardImage", 1, "dashboardImage"],
    ["provenance", "apiImage", null, "apiImage"],
    ["provenance", "dashboardImage", null, "dashboardImage"],
    ["provenance", "helmChart", null, "helmChart"],
  ];
  for (const [section, record, index, artifact] of bindings) {
    const manifest = createManifest(values());
    const subject = index === null ? manifest[section][record] : manifest[section][record][index];
    subject.ref = "oci://example.test/different-subject@sha256:deadbeef";
    const errors = validateManifest(manifest);
    assert(
      errors.includes(
        `${section}.${record}${index === null ? "" : `[${index}]`}.ref must equal artifacts.${artifact}.ref`,
      ),
      `${section}.${record} accepted a mismatched subject`,
    );
  }
});

test("requires both SBOM platforms in canonical order", () => {
  const missing = createManifest(values());
  missing.sboms.apiImage.pop();
  assert(
    validateManifest(missing).includes(
      "sboms.apiImage must contain exactly linux/amd64 and linux/arm64 entries",
    ),
  );

  const reordered = createManifest(values());
  reordered.sboms.dashboardImage.reverse();
  const errors = validateManifest(reordered);
  assert(errors.includes("sboms.dashboardImage[0].platform must be linux/amd64"));
  assert(errors.includes("sboms.dashboardImage[1].platform must be linux/arm64"));

  const duplicate = createManifest(values());
  duplicate.sboms.apiImage[1].platform = "linux/amd64";
  assert(validateManifest(duplicate).includes("sboms.apiImage[1].platform must be linux/arm64"));
});

test("rejects missing identity and unknown fields", () => {
  const manifest = createManifest(values());
  manifest.source.commit = "abc";
  manifest.source.repository = "";
  manifest.githubActions.runId = "";
  manifest.githubActions.workflowRef = "";
  manifest.untrusted = true;
  const errors = validateManifest(manifest);
  assert(errors.includes("source.commit must be a lowercase 40-character Git commit"));
  assert(
    errors.includes(
      "source.repository must be a nonempty, trimmed string without control characters",
    ),
  );
  assert(errors.includes("githubActions.runId must be a positive integer string"));
  assert(
    errors.includes(
      "githubActions.workflowRef must be a nonempty, trimmed string without control characters",
    ),
  );
  assert(errors.includes("manifest has unknown fields: untrusted"));
});

test("generate and verify round-trip through the CLI", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "kubelb-release-manifest-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const output = join(directory, "manifest.json");
  const args = ["generate"];
  for (const [name, value] of Object.entries({ ...values(), output }))
    args.push(`--${name}`, value);

  const generated = spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
  });
  assert.equal(generated.status, 0, generated.stderr);
  assert.equal(
    readFileSync(output, "utf8"),
    canonicalJson(createManifest({ ...values(), output })),
  );

  const checked = spawnSync(process.execPath, [cli, "verify", "--input", output], {
    encoding: "utf8",
  });
  assert.equal(checked.status, 0, checked.stderr);
});

test("check rejects semantically valid noncanonical JSON", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "kubelb-release-manifest-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const input = join(directory, "manifest.json");
  writeFileSync(input, JSON.stringify(createManifest(values())), "utf8");

  const checked = spawnSync(process.execPath, [cli, "check", "--input", input], {
    encoding: "utf8",
  });
  assert.equal(checked.status, 1);
  assert.match(checked.stderr, /manifest is not canonical JSON/);
});
