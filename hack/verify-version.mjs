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

import { readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;

const errors = [];
const chart = read("charts/kubelb-dashboard/Chart.yaml");

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
if (releaseTag && releaseTag !== `v${version}`) {
  errors.push(`release tag is ${releaseTag}; expected v${version}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

if (process.argv.includes("--print")) {
  console.log(version);
} else {
  console.log(`Chart version metadata is consistent: ${version}`);
}
