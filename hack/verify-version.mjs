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

const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;

const chartOption = process.argv.indexOf("--chart");
if (chartOption !== -1 && !process.argv[chartOption + 1]) {
  console.error("--chart requires a path");
  process.exit(1);
}

const chartPath =
  chartOption === -1
    ? new URL("../charts/kubelb-dashboard/Chart.yaml", import.meta.url)
    : process.argv[chartOption + 1];
const errors = [];
const chart = readFileSync(chartPath, "utf8");

function chartValue(key) {
  const match = chart.match(new RegExp(`^${key}:\\s*["']?([^"'\\s#]+)["']?\\s*$`, "m"));
  return match?.[1];
}

const version = chartValue("version");
const appVersion = chartValue("appVersion");

if (!semver.test(version)) {
  errors.push(
    `Chart.yaml version must be SemVer without a leading v or build metadata; got ${String(version)}`,
  );
}

if (appVersion !== `v${version}`) {
  errors.push(`Chart.yaml appVersion has ${String(appVersion)}; expected v${String(version)}`);
}

const releaseTag = process.env.RELEASE_TAG;
let resolvedVersion = version;
if (releaseTag) {
  const taggedVersion = releaseTag.startsWith("v") ? releaseTag.slice(1) : "";
  if (!semver.test(taggedVersion)) {
    errors.push(
      `release tag must be v followed by SemVer without build metadata; got ${releaseTag}`,
    );
  } else {
    resolvedVersion = taggedVersion;
  }
}

if (process.argv.includes("--write") && !releaseTag) {
  errors.push("--write requires RELEASE_TAG");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

if (process.argv.includes("--write")) {
  const releaseChart = chart
    .replace(/^version:\s*.*$/m, `version: ${resolvedVersion}`)
    .replace(/^appVersion:\s*.*$/m, `appVersion: "v${resolvedVersion}"`);
  writeFileSync(chartPath, releaseChart);
  console.log(`Prepared Chart.yaml for release v${resolvedVersion}`);
} else if (process.argv.includes("--print")) {
  console.log(resolvedVersion);
} else if (releaseTag) {
  console.log(`Release version resolved from tag: ${resolvedVersion}`);
} else {
  console.log(`Chart version metadata is consistent: ${resolvedVersion}`);
}
