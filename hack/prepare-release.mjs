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

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

export const STRICT_SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;

const METADATA_PATHS = [
  "VERSION",
  "package.json",
  "api/package.json",
  "charts/kubelb-dashboard/Chart.yaml",
];

const HELP = `Prepare committed version metadata and deterministic release notes.

Usage:
  node hack/prepare-release.mjs --version <semver> --pulls <pulls.json> [options]

Required:
  --version <semver>  Target version without a leading "v" or build metadata
  --pulls <path>      GitHub API JSON containing merged pull request objects

Options:
  --output <path>     Write release notes here; otherwise print them to stdout
  --repo <path>       Repository root (default: parent of this script)
  --head <ref>        Git revision used for reachability (default: HEAD)
  --check             Do not write; fail if metadata or --output differs
  --dry-run           Do not write; print planned files and release notes
  --help              Show this help

The pull request input may be an array, gh --paginate --slurp output, or an
object with an "items" array. Note-bearing PRs must include number, merged_at,
merge_commit_sha, body, and optionally html_url. The tool never uses network.
`;

export function validateVersion(version) {
  if (!STRICT_SEMVER.test(version)) {
    throw new Error(
      `target version must be SemVer without a leading v or build metadata; got ${version}`,
    );
  }
}

function git(repo, args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function isAncestor(repo, ancestor, descendant) {
  try {
    git(repo, ["merge-base", "--is-ancestor", ancestor, descendant]);
    return true;
  } catch (error) {
    if (error?.status === 1) return false;
    throw new Error(
      `cannot determine whether ${ancestor} is reachable from ${descendant}: ${error.stderr?.trim() ?? error.message}`,
    );
  }
}

function parseSemver(version) {
  const match = version.match(STRICT_SEMVER);
  if (!match) throw new Error(`invalid SemVer: ${version}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4]?.split(".") ?? [],
  };
}

function compareIdentifiers(left, right) {
  const leftNumeric = /^\d+$/.test(left);
  const rightNumeric = /^\d+$/.test(right);
  if (leftNumeric && rightNumeric) return Number(left) - Number(right);
  if (leftNumeric) return -1;
  if (rightNumeric) return 1;
  return left === right ? 0 : left < right ? -1 : 1;
}

export function compareSemver(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }
  if (a.prerelease.length === 0 || b.prerelease.length === 0) {
    return b.prerelease.length - a.prerelease.length;
  }
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    if (a.prerelease[index] === undefined) return -1;
    if (b.prerelease[index] === undefined) return 1;
    const compared = compareIdentifiers(a.prerelease[index], b.prerelease[index]);
    if (compared !== 0) return compared;
  }
  return 0;
}

export function selectPreviousTag(repo, targetVersion, head = "HEAD") {
  validateVersion(targetVersion);
  const targetTag = `v${targetVersion}`;
  const tags = git(repo, ["tag", "--merged", head, "--list", "v*"])
    .split("\n")
    .filter(Boolean)
    .filter((tag) => tag !== targetTag && STRICT_SEMVER.test(tag.slice(1)));

  const candidates = tags.map((tag) => ({
    tag,
    distance: Number(git(repo, ["rev-list", "--count", `${tag}..${head}`])),
  }));

  candidates.sort(
    (left, right) =>
      left.distance - right.distance ||
      compareSemver(right.tag.slice(1), left.tag.slice(1)) ||
      (left.tag === right.tag ? 0 : left.tag < right.tag ? -1 : 1),
  );
  return candidates[0]?.tag ?? null;
}

function replacePackageVersion(content, version, path) {
  JSON.parse(content);
  const pattern = /^(\s*"version"\s*:\s*")[^"]*("\s*,?\s*)$/m;
  if (!pattern.test(content)) throw new Error(`${path} has no string version field`);
  return content.replace(pattern, `$1${version}$2`);
}

function replaceChartValue(content, key, value) {
  const pattern = new RegExp(`^(${key}:\\s*)(["']?)([^"'\\s#]+)(["']?)(\\s*)$`, "m");
  const match = content.match(pattern);
  if (!match || match[2] !== match[4]) throw new Error(`Chart.yaml has no valid ${key} field`);
  return content.replace(pattern, (_, prefix, quote, _current, _closingQuote, whitespace) => {
    return `${prefix}${quote}${value}${quote}${whitespace}`;
  });
}

export function planMetadataUpdates(repo, version) {
  validateVersion(version);
  return METADATA_PATHS.map((relativePath) => {
    const path = resolve(repo, relativePath);
    const current = readFileSync(path, "utf8");
    let expected;
    if (relativePath === "VERSION") {
      expected = `${version}\n`;
    } else if (relativePath.endsWith("package.json")) {
      expected = replacePackageVersion(current, version, relativePath);
    } else {
      expected = replaceChartValue(
        replaceChartValue(current, "version", version),
        "appVersion",
        `v${version}`,
      );
    }
    return { relativePath, path, current, expected, changed: current !== expected };
  });
}

function flattenPulls(value) {
  if (Array.isArray(value)) return value.flatMap(flattenPulls);
  if (value && typeof value === "object" && Array.isArray(value.items)) {
    return value.items.flatMap(flattenPulls);
  }
  if (value && typeof value === "object") return [value];
  throw new Error("pull request JSON must contain objects");
}

export function parsePullRequests(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`invalid pull request JSON: ${error.message}`);
  }
  return flattenPulls(parsed);
}

export function extractReleaseNoteBlocks(body = "") {
  if (typeof body !== "string") return [];
  const blocks = [];
  const pattern = /```release-note[ \t]*\r?\n([\s\S]*?)```/gi;
  for (const match of body.matchAll(pattern)) {
    const note = match[1]
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
    if (note && !/^(?:none|n\/a)$/i.test(note)) blocks.push(note);
  }
  return blocks;
}

export function selectReleaseNotes(repo, pulls, previousTag, head = "HEAD") {
  const notes = [];
  for (const pull of pulls) {
    const blocks = extractReleaseNoteBlocks(pull.body);
    if (blocks.length === 0 || !pull.merged_at) continue;
    if (!Number.isInteger(pull.number) || typeof pull.merge_commit_sha !== "string") {
      throw new Error("note-bearing merged PRs require number and merge_commit_sha");
    }
    if (!isAncestor(repo, pull.merge_commit_sha, head)) continue;
    if (previousTag && isAncestor(repo, pull.merge_commit_sha, previousTag)) continue;
    for (const [index, text] of blocks.entries()) {
      notes.push({
        number: pull.number,
        url: typeof pull.html_url === "string" ? pull.html_url : null,
        index,
        text,
      });
    }
  }
  return notes.sort((left, right) => left.number - right.number || left.index - right.index);
}

function indentNote(text) {
  return text.replace(/\n/g, "\n  ");
}

export function renderReleaseNotes(version, previousTag, notes) {
  validateVersion(version);
  const range = previousTag ? `Changes since ${previousTag}.` : "Initial release.";
  const content = notes.length
    ? notes
        .map(({ text, number, url }) => {
          const reference = url ? `[#${number}](${url})` : `#${number}`;
          return `- ${indentNote(text)} (${reference})`;
        })
        .join("\n")
    : "No user-facing changes were declared.";
  return `# KubeLB Dashboard v${version}\n\n${range}\n\n## Release notes\n\n${content}\n`;
}

function resolveFromRepo(repo, path) {
  return isAbsolute(path) ? path : resolve(repo, path);
}

export function run(argv, io = {}) {
  const stdout = io.stdout ?? ((message) => process.stdout.write(message));
  const stderr = io.stderr ?? ((message) => process.stderr.write(message));
  const { values } = parseArgs({
    args: argv,
    allowPositionals: false,
    strict: true,
    options: {
      version: { type: "string" },
      pulls: { type: "string" },
      output: { type: "string" },
      repo: { type: "string" },
      head: { type: "string", default: "HEAD" },
      check: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    stdout(HELP);
    return 0;
  }
  if (!values.version || !values.pulls) {
    throw new Error("--version and --pulls are required; use --help for usage");
  }
  if (values.check && values["dry-run"]) {
    throw new Error("--check and --dry-run cannot be combined");
  }

  validateVersion(values.version);
  const defaultRepo = fileURLToPath(new URL("../", import.meta.url));
  const repo = resolve(values.repo ?? defaultRepo);
  const pullsPath = resolveFromRepo(repo, values.pulls);
  const outputPath = values.output ? resolveFromRepo(repo, values.output) : null;
  if (outputPath === pullsPath) throw new Error("--output must differ from --pulls");

  const updates = planMetadataUpdates(repo, values.version);
  const previousTag = selectPreviousTag(repo, values.version, values.head);
  const pulls = parsePullRequests(readFileSync(pullsPath, "utf8"));
  const notes = selectReleaseNotes(repo, pulls, previousTag, values.head);
  const rendered = renderReleaseNotes(values.version, previousTag, notes);

  if (values.check) {
    const drift = updates.filter((update) => update.changed).map((update) => update.relativePath);
    if (outputPath && (!existsSync(outputPath) || readFileSync(outputPath, "utf8") !== rendered)) {
      drift.push(values.output);
    }
    if (drift.length > 0) {
      stderr(`Release preparation differs: ${drift.join(", ")}\n`);
      return 1;
    }
    stderr(`Release preparation is consistent for v${values.version}.\n`);
    if (!outputPath) stdout(rendered);
    return 0;
  }

  if (values["dry-run"]) {
    const changed = updates.filter((update) => update.changed).map((update) => update.relativePath);
    stderr(`Would update: ${changed.length ? changed.join(", ") : "no version metadata"}\n`);
    if (outputPath) stderr(`Would write release notes: ${values.output}\n`);
    stdout(rendered);
    return 0;
  }

  for (const update of updates) {
    if (update.changed) writeFileSync(update.path, update.expected);
  }
  if (outputPath) writeFileSync(outputPath, rendered);
  else stdout(rendered);
  stderr(`Prepared v${values.version} from ${previousTag ?? "the initial release"}.\n`);
  return 0;
}

function main() {
  try {
    process.exitCode = run(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
