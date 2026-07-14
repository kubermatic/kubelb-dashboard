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

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const GIT_COMMIT = /^[0-9a-f]{40}$/;
const POSITIVE_INTEGER = /^[1-9]\d*$/;

const GENERATE_FLAGS = [
  "api-image-digest",
  "api-image-ref",
  "api-provenance-ref",
  "api-sbom-amd64-digest",
  "api-sbom-arm64-digest",
  "api-sbom-ref",
  "dashboard-image-digest",
  "dashboard-image-ref",
  "dashboard-provenance-ref",
  "dashboard-sbom-amd64-digest",
  "dashboard-sbom-arm64-digest",
  "dashboard-sbom-ref",
  "github-run-attempt",
  "github-run-id",
  "github-run-url",
  "github-workflow-ref",
  "helm-chart-digest",
  "helm-chart-provenance-ref",
  "helm-chart-ref",
  "output",
  "source-commit",
  "source-repository",
  "tag",
  "version",
];

const USAGE = `Usage:
  node hack/release-manifest.mjs generate [required flags]
  node hack/release-manifest.mjs check --input <manifest.json>
  node hack/release-manifest.mjs verify --input <manifest.json>

Generate flags:
${GENERATE_FLAGS.map((flag) => `  --${flag} <value>`).join("\n")}`;

function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalValue(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalValue(value), null, 2)}\n`;
}

function parseFlags(args, allowed) {
  const values = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!flag?.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new Error(`expected --flag <value>; got ${flag ?? "end of input"}`);
    }
    const name = flag.slice(2);
    if (!allowed.includes(name)) throw new Error(`unknown flag: ${flag}`);
    if (Object.hasOwn(values, name)) throw new Error(`duplicate flag: ${flag}`);
    values[name] = value;
  }
  const missing = allowed.filter((name) => !Object.hasOwn(values, name));
  if (missing.length > 0)
    throw new Error(`missing flags: ${missing.map((name) => `--${name}`).join(", ")}`);
  return values;
}

export function createManifest(values) {
  return {
    artifacts: {
      apiImage: { digest: values["api-image-digest"], ref: values["api-image-ref"] },
      dashboardImage: {
        digest: values["dashboard-image-digest"],
        ref: values["dashboard-image-ref"],
      },
      helmChart: { digest: values["helm-chart-digest"], ref: values["helm-chart-ref"] },
    },
    githubActions: {
      runAttempt: values["github-run-attempt"],
      runId: values["github-run-id"],
      runUrl: values["github-run-url"],
      workflowRef: values["github-workflow-ref"],
    },
    provenance: {
      apiImage: { ref: values["api-provenance-ref"] },
      dashboardImage: { ref: values["dashboard-provenance-ref"] },
      helmChart: { ref: values["helm-chart-provenance-ref"] },
    },
    release: { tag: values.tag, version: values.version },
    sboms: {
      apiImage: [
        {
          digest: values["api-sbom-amd64-digest"],
          format: "spdx-json",
          platform: "linux/amd64",
          ref: values["api-sbom-ref"],
        },
        {
          digest: values["api-sbom-arm64-digest"],
          format: "spdx-json",
          platform: "linux/arm64",
          ref: values["api-sbom-ref"],
        },
      ],
      dashboardImage: [
        {
          digest: values["dashboard-sbom-amd64-digest"],
          format: "spdx-json",
          platform: "linux/amd64",
          ref: values["dashboard-sbom-ref"],
        },
        {
          digest: values["dashboard-sbom-arm64-digest"],
          format: "spdx-json",
          platform: "linux/arm64",
          ref: values["dashboard-sbom-ref"],
        },
      ],
    },
    schemaVersion: 1,
    source: { commit: values["source-commit"], repository: values["source-repository"] },
  };
}

function exactObject(value, path, keys, errors) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${path} must be an object`);
    return null;
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length > 0) errors.push(`${path} is missing: ${missing.join(", ")}`);
  if (extra.length > 0) errors.push(`${path} has unknown fields: ${extra.join(", ")}`);
  return value;
}

function nonempty(value, path, errors) {
  if (
    typeof value !== "string" ||
    value.trim() !== value ||
    value.length === 0 ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    errors.push(`${path} must be a nonempty, trimmed string without control characters`);
    return false;
  }
  return true;
}

function digest(value, path, errors) {
  if (!SHA256.test(value)) errors.push(`${path} must be a lowercase sha256 digest`);
}

function validateArtifact(value, path, suffix, errors) {
  const artifact = exactObject(value, path, ["digest", "ref"], errors);
  if (!artifact) return;
  digest(artifact.digest, `${path}.digest`, errors);
  if (
    nonempty(artifact.ref, `${path}.ref`, errors) &&
    !artifact.ref.endsWith(`${suffix}@${artifact.digest}`)
  ) {
    errors.push(`${path}.ref must end with ${suffix}@<matching digest>`);
  }
}

function validateSboms(value, path, artifactRef, artifactPath, errors) {
  if (!Array.isArray(value) || value.length !== 2) {
    errors.push(`${path} must contain exactly linux/amd64 and linux/arm64 entries`);
    return;
  }
  const platforms = ["linux/amd64", "linux/arm64"];
  for (const [index, platform] of platforms.entries()) {
    const itemPath = `${path}[${index}]`;
    const sbom = exactObject(
      value[index],
      itemPath,
      ["digest", "format", "platform", "ref"],
      errors,
    );
    if (!sbom) continue;
    digest(sbom.digest, `${itemPath}.digest`, errors);
    if (sbom.format !== "spdx-json") errors.push(`${itemPath}.format must be spdx-json`);
    if (sbom.platform !== platform) errors.push(`${itemPath}.platform must be ${platform}`);
    if (nonempty(sbom.ref, `${itemPath}.ref`, errors) && sbom.ref !== artifactRef) {
      errors.push(`${itemPath}.ref must equal ${artifactPath}.ref`);
    }
  }
}

function validateProvenance(value, path, artifactRef, artifactPath, errors) {
  const provenance = exactObject(value, path, ["ref"], errors);
  if (
    provenance &&
    nonempty(provenance.ref, `${path}.ref`, errors) &&
    provenance.ref !== artifactRef
  ) {
    errors.push(`${path}.ref must equal ${artifactPath}.ref`);
  }
}

export function validateManifest(manifest) {
  const errors = [];
  const root = exactObject(
    manifest,
    "manifest",
    ["artifacts", "githubActions", "provenance", "release", "sboms", "schemaVersion", "source"],
    errors,
  );
  if (!root) return errors;

  if (root.schemaVersion !== 1) errors.push("schemaVersion must be 1");

  const release = exactObject(root.release, "release", ["tag", "version"], errors);
  if (release) {
    if (!SEMVER.test(release.version))
      errors.push("release.version must be SemVer without v or build metadata");
    if (release.tag !== `v${release.version}`)
      errors.push("release.tag must be v followed by release.version");
  }

  const source = exactObject(root.source, "source", ["commit", "repository"], errors);
  if (source) {
    nonempty(source.repository, "source.repository", errors);
    if (!GIT_COMMIT.test(source.commit))
      errors.push("source.commit must be a lowercase 40-character Git commit");
  }

  const actions = exactObject(
    root.githubActions,
    "githubActions",
    ["runAttempt", "runId", "runUrl", "workflowRef"],
    errors,
  );
  if (actions) {
    if (!POSITIVE_INTEGER.test(actions.runId))
      errors.push("githubActions.runId must be a positive integer string");
    if (!POSITIVE_INTEGER.test(actions.runAttempt)) {
      errors.push("githubActions.runAttempt must be a positive integer string");
    }
    nonempty(actions.runUrl, "githubActions.runUrl", errors);
    nonempty(actions.workflowRef, "githubActions.workflowRef", errors);
  }

  const artifacts = exactObject(
    root.artifacts,
    "artifacts",
    ["apiImage", "dashboardImage", "helmChart"],
    errors,
  );
  if (artifacts && release) {
    validateArtifact(artifacts.apiImage, "artifacts.apiImage", `:${release.tag}`, errors);
    validateArtifact(
      artifacts.dashboardImage,
      "artifacts.dashboardImage",
      `:${release.tag}`,
      errors,
    );
    validateArtifact(artifacts.helmChart, "artifacts.helmChart", `:${release.version}`, errors);
  }

  const sboms = exactObject(root.sboms, "sboms", ["apiImage", "dashboardImage"], errors);
  if (sboms && artifacts) {
    validateSboms(
      sboms.apiImage,
      "sboms.apiImage",
      artifacts.apiImage?.ref,
      "artifacts.apiImage",
      errors,
    );
    validateSboms(
      sboms.dashboardImage,
      "sboms.dashboardImage",
      artifacts.dashboardImage?.ref,
      "artifacts.dashboardImage",
      errors,
    );
  }

  const provenance = exactObject(
    root.provenance,
    "provenance",
    ["apiImage", "dashboardImage", "helmChart"],
    errors,
  );
  if (provenance && artifacts) {
    validateProvenance(
      provenance.apiImage,
      "provenance.apiImage",
      artifacts.apiImage?.ref,
      "artifacts.apiImage",
      errors,
    );
    validateProvenance(
      provenance.dashboardImage,
      "provenance.dashboardImage",
      artifacts.dashboardImage?.ref,
      "artifacts.dashboardImage",
      errors,
    );
    validateProvenance(
      provenance.helmChart,
      "provenance.helmChart",
      artifacts.helmChart?.ref,
      "artifacts.helmChart",
      errors,
    );
  }

  return errors;
}

function assertValid(manifest) {
  const errors = validateManifest(manifest);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}

function main(argv) {
  const [command, ...args] = argv;
  if (!command || command === "help" || command === "--help") {
    console.log(USAGE);
    return;
  }

  if (command === "generate") {
    const values = parseFlags(args, GENERATE_FLAGS);
    const manifest = createManifest(values);
    assertValid(manifest);
    writeFileSync(values.output, canonicalJson(manifest), "utf8");
    console.log(`Release manifest generated: ${values.output}`);
    return;
  }

  if (command === "check" || command === "verify") {
    const values = parseFlags(args, ["input"]);
    const input = readFileSync(values.input, "utf8");
    const manifest = JSON.parse(input);
    assertValid(manifest);
    if (input !== canonicalJson(manifest)) throw new Error("manifest is not canonical JSON");
    console.log(`Release manifest is valid: ${values.input}`);
    return;
  }

  throw new Error(`unknown command: ${command}\n${USAGE}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
