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

const cli = fileURLToPath(new URL("./verify-version.mjs", import.meta.url));
const chart = `apiVersion: v2
name: kubelb-dashboard
version: 0.0.0-dev
appVersion: "v0.0.0-dev"
`;

function run(args = [], releaseTag) {
  return spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    env: { ...process.env, RELEASE_TAG: releaseTag ?? "" },
  });
}

for (const [tag, version] of [
  ["v1.1.0-beta.0", "1.1.0-beta.0"],
  ["v1.1.0", "1.1.0"],
]) {
  test(`uses ${tag} as the artifact version`, () => {
    const result = run(["--print"], tag);

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), version);
  });
}

test("rejects malformed release tags", () => {
  const result = run(["--print"], "1.1.0-beta.0");

  assert.equal(result.status, 1);
  assert.match(result.stderr, /release tag must be v followed by SemVer/);
});

test("writes release metadata without changing the source version first", () => {
  const directory = mkdtempSync(join(tmpdir(), "kubelb-version-"));
  const chartPath = join(directory, "Chart.yaml");
  writeFileSync(chartPath, chart);

  try {
    const result = run(["--write", "--chart", chartPath], "v1.1.0-beta.0");

    assert.equal(result.status, 0);
    assert.match(readFileSync(chartPath, "utf8"), /^version: 1\.1\.0-beta\.0$/m);
    assert.match(readFileSync(chartPath, "utf8"), /^appVersion: "v1\.1\.0-beta\.0"$/m);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

test("requires a release tag before writing chart metadata", () => {
  const result = run(["--write"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--write requires RELEASE_TAG/);
});
