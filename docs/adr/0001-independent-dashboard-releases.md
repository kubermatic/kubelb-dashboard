# ADR 0001: Release the Dashboard independently

- Status: Accepted; version-source decision superseded by ADR 0002
- Date: 2026-07-14

## Context

KubeLB Dashboard and KubeLB are separate deliverables with different change
rates. Giving both products the same version would imply source and release
coupling that does not exist. It would also require no-op Dashboard releases for
unrelated KubeLB changes.

The Dashboard still needs explicit compatibility evidence so a KubeLB release
can select a tested Dashboard artifact.

## Decision

- KubeLB Dashboard owns an independent Semantic Version.
- Release version sourcing is defined by
  [ADR 0002](0002-tag-derived-release-version.md). The private npm packages are
  not release artifacts and do not mirror the release version.
- Release branches use `release/vMAJOR.MINOR`; release tags use
  `vMAJOR.MINOR.PATCH` with an optional SemVer prerelease suffix.
- GitHub Releases are the canonical human-readable changelog.
- Each Dashboard release targets the current and previous supported KubeLB
  minor (`N` and `N-1`). Support is claimed only when exact compatibility test
  evidence exists.
- A KubeLB release selects an existing Dashboard release in its compatibility
  manifest or bill of materials. It does not create a matching Dashboard tag.

## Consequences

- Dashboard releases can ship when Dashboard changes are ready.
- KubeLB and Dashboard version numbers are not expected to match.
- A release tag selects the artifact version without requiring a metadata-only
  source commit.
- Compatibility evidence is managed separately from artifact publication.
- KubeLB release tooling needs a follow-up integration that records the selected
  Dashboard version and immutable artifact digests.
