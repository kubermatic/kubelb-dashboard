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
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  compareSemver,
  extractReleaseNoteBlocks,
  parsePullRequests,
  planMetadataUpdates,
  renderReleaseNotes,
  run,
  selectPreviousTag,
  selectReleaseNotes,
  validateVersion,
} from "./prepare-release.mjs";

function git(repo, ...args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8" }).trim();
}

function createRepo() {
  const repo = mkdtempSync(join(tmpdir(), "kubelb-release-test-"));
  git(repo, "init", "-q");
  git(repo, "config", "user.name", "Release Test");
  git(repo, "config", "user.email", "release@example.com");
  git(repo, "config", "commit.gpgsign", "false");
  return repo;
}

function commit(repo, message) {
  writeFileSync(join(repo, "history"), `${message}\n`, { flag: "a" });
  git(repo, "add", "history");
  git(repo, "commit", "-q", "-m", message);
  return git(repo, "rev-parse", "HEAD");
}

function writeMetadata(repo, version) {
  mkdirSync(join(repo, "api"), { recursive: true });
  mkdirSync(join(repo, "charts/kubelb-dashboard"), { recursive: true });
  writeFileSync(join(repo, "VERSION"), `${version}\n`);
  writeFileSync(join(repo, "package.json"), `{\n  "version": "${version}"\n}\n`);
  writeFileSync(join(repo, "api/package.json"), `{\n  "version": "${version}"\n}\n`);
  writeFileSync(
    join(repo, "charts/kubelb-dashboard/Chart.yaml"),
    `version: ${version}\nappVersion: "v${version}"\n`,
  );
}

test("validates strict canonical versions and SemVer precedence", () => {
  assert.doesNotThrow(() => validateVersion("1.2.3-rc.1"));
  for (const invalid of ["v1.2.3", "01.2.3", "1.2", "1.2.3+build"]) {
    assert.throws(() => validateVersion(invalid), /target version must be SemVer/);
  }
  assert.ok(compareSemver("1.2.3", "1.2.3-rc.1") > 0);
  assert.ok(compareSemver("1.2.3-rc.2", "1.2.3-rc.1") > 0);
});

test("plans all committed version mirrors without changing formatting", () => {
  const repo = createRepo();
  writeMetadata(repo, "1.0.0");
  const updates = planMetadataUpdates(repo, "1.1.0-rc.1");
  assert.deepEqual(
    updates.filter(({ changed }) => changed).map(({ relativePath }) => relativePath),
    ["VERSION", "package.json", "api/package.json", "charts/kubelb-dashboard/Chart.yaml"],
  );
  assert.match(updates[1].expected, /"version": "1\.1\.0-rc\.1"/);
  assert.match(updates[3].expected, /version: 1\.1\.0-rc\.1/);
  assert.match(updates[3].expected, /appVersion: "v1\.1\.0-rc\.1"/);

  writeMetadata(repo, "1.1.0-rc.1");
  assert.equal(
    planMetadataUpdates(repo, "1.1.0-rc.1").some(({ changed }) => changed),
    false,
  );
});

test("selects the nearest reachable release tag with deterministic tie-breaking", () => {
  const repo = createRepo();
  commit(repo, "initial");
  git(repo, "tag", "v1.0.0");
  commit(repo, "stable");
  git(repo, "tag", "v1.0.1");
  git(repo, "tag", "v1.1.0-alpha.0");
  const main = git(repo, "branch", "--show-current");
  git(repo, "switch", "-q", "-c", "unmerged", "v1.0.0");
  commit(repo, "unmerged");
  git(repo, "tag", "v9.0.0");
  git(repo, "switch", "-q", main);
  commit(repo, "head");

  assert.equal(selectPreviousTag(repo, "1.2.0"), "v1.1.0-alpha.0");
  assert.equal(selectPreviousTag(repo, "1.1.0-alpha.0"), "v1.0.1");
});

test("extracts reviewed blocks from paginated GitHub JSON and renders stable notes", () => {
  const pulls = parsePullRequests(
    JSON.stringify([
      [
        {
          number: 12,
          body: "```release-note\nSecond change\n```",
        },
      ],
      [
        {
          number: 7,
          body: "```release-note\r\nFirst change\r\nwith context  \r\n```\n```release-note\nNONE\n```",
        },
      ],
    ]),
  );
  assert.deepEqual(extractReleaseNoteBlocks(pulls[1].body), ["First change\nwith context"]);
  assert.equal(
    renderReleaseNotes("1.2.0", "v1.1.0", [
      { number: 7, url: "https://example.test/pull/7", text: "First change\nwith context" },
      { number: 12, url: null, text: "Second change" },
    ]),
    "# KubeLB Dashboard v1.2.0\n\nChanges since v1.1.0.\n\n## Release notes\n\n" +
      "- First change\n  with context ([#7](https://example.test/pull/7))\n" +
      "- Second change (#12)\n",
  );
});

test("filters release notes to merged commits after the previous tag", () => {
  const repo = createRepo();
  const before = commit(repo, "before");
  git(repo, "tag", "v1.0.0");
  const after = commit(repo, "after");
  const pulls = [
    {
      number: 1,
      merged_at: "2026-01-01T00:00:00Z",
      merge_commit_sha: before,
      body: "```release-note\nOld\n```",
    },
    {
      number: 2,
      merged_at: "2026-01-02T00:00:00Z",
      merge_commit_sha: after,
      html_url: "https://example.test/pull/2",
      body: "```release-note\nNew\n```",
    },
    {
      number: 3,
      merged_at: null,
      merge_commit_sha: after,
      body: "```release-note\nUnmerged\n```",
    },
  ];
  assert.deepEqual(selectReleaseNotes(repo, pulls, "v1.0.0"), [
    {
      number: 2,
      url: "https://example.test/pull/2",
      index: 0,
      text: "New",
    },
  ]);
});

test("dry-run is read-only; write and check modes are deterministic", () => {
  const repo = createRepo();
  writeMetadata(repo, "1.0.0");
  commit(repo, "release 1.0.0");
  git(repo, "tag", "v1.0.0");
  const merged = commit(repo, "feature");
  writeFileSync(
    join(repo, "pulls.json"),
    JSON.stringify([
      {
        number: 4,
        merged_at: "2026-01-02T00:00:00Z",
        merge_commit_sha: merged,
        body: "```release-note\nFeature\n```",
      },
    ]),
  );
  const output = [];
  const errors = [];
  const io = { stdout: (value) => output.push(value), stderr: (value) => errors.push(value) };

  assert.equal(
    run(["--repo", repo, "--version", "1.1.0", "--pulls", "pulls.json", "--dry-run"], io),
    0,
  );
  assert.equal(readFileSync(join(repo, "VERSION"), "utf8"), "1.0.0\n");
  assert.match(output.join(""), /Feature \(#4\)/);
  assert.match(errors.join(""), /Would update: VERSION/);

  assert.equal(
    run(
      ["--repo", repo, "--version", "1.1.0", "--pulls", "pulls.json", "--output", "notes.md"],
      io,
    ),
    0,
  );
  assert.equal(readFileSync(join(repo, "VERSION"), "utf8"), "1.1.0\n");
  assert.match(readFileSync(join(repo, "notes.md"), "utf8"), /Feature \(#4\)/);
  assert.equal(
    run(
      [
        "--repo",
        repo,
        "--version",
        "1.1.0",
        "--pulls",
        "pulls.json",
        "--output",
        "notes.md",
        "--check",
      ],
      io,
    ),
    0,
  );
});
