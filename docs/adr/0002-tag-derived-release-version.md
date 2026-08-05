# ADR 0002: Derive release versions from tags

- Status: Accepted
- Date: 2026-08-05

## Context

Requiring the committed Helm chart version and a release tag to match forces a
metadata-only pull request before every release. This is especially cumbersome
for prereleases, where several versions may be cut from otherwise unchanged
source.

Protected tags and the protected release environment already control who may
publish. The release workflow also binds every artifact to the exact source tag
and commit through signatures, attestations, and the release manifest.

## Decision

- A valid `vMAJOR.MINOR.PATCH` tag, including an optional SemVer prerelease
  suffix, is the canonical version for release artifacts.
- The committed Helm chart uses the permanent `0.0.0-dev` / `v0.0.0-dev`
  development sentinel.
- The release workflow writes the tag-derived version into its temporary chart
  workspace before regenerating chart documentation and packaging.
- A committed `docs/releases/<tag>.md` file supplies curated notes when present.
  Otherwise, GitHub generates release notes from repository history.
- Build metadata is rejected because it cannot be represented consistently in
  all published OCI tags.

## Consequences

- Any reviewed commit can be released without a preparatory version-only commit.
- The development sentinel is changed once and is not advanced for releases.
- The packaged chart metadata can differ from `Chart.yaml` at the source commit;
  the tag and signed release manifest record the authoritative version.
- Release managers may still commit curated notes when needed.
- Tag protection and release-environment approval remain mandatory because tags
  select externally visible versions.
