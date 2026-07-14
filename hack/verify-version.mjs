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
const version = read("VERSION").trim();
const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;

const errors = [];

if (!semver.test(version)) {
  errors.push(`VERSION must be SemVer without a leading v or build metadata; got ${version}`);
}

const dashboardPackage = JSON.parse(read("package.json"));
const apiPackage = JSON.parse(read("api/package.json"));
const chart = read("charts/kubelb-dashboard/Chart.yaml");

function chartValue(key) {
  const match = chart.match(new RegExp(`^${key}:\\s*["']?([^"'\\s#]+)["']?\\s*$`, "m"));
  return match?.[1];
}

const mirrors = new Map([
  ["package.json", [dashboardPackage.version, version]],
  ["api/package.json", [apiPackage.version, version]],
  ["Chart.yaml version", [chartValue("version"), version]],
  ["Chart.yaml appVersion", [chartValue("appVersion"), `v${version}`]],
]);

for (const [name, [value, expected]] of mirrors) {
  if (value !== expected) {
    errors.push(`${name} has ${String(value)}; expected ${expected}`);
  }
}

const releaseTag = process.env.RELEASE_TAG;
if (releaseTag && releaseTag !== `v${version}`) {
  errors.push(`release tag is ${releaseTag}; expected v${version}`);
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Version metadata is consistent: ${version}`);
