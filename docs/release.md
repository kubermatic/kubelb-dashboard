# KubeLB Dashboard releases

The Dashboard follows independent [Semantic Versioning](https://semver.org/).
It does not automatically inherit the KubeLB version. See
[ADR 0001](adr/0001-independent-dashboard-releases.md) for the decision and its
compatibility implications.

## Version metadata

[`VERSION`](../VERSION) is canonical and contains SemVer without a leading `v`.
Build metadata (`+...`) is not supported because it cannot be represented in all
published OCI tags.

| Consumer                                                             | Representation for version `1.2.3` |
| -------------------------------------------------------------------- | ---------------------------------- |
| `VERSION`, package manifests, Helm chart version                     | `1.2.3`                            |
| Git tag, GitHub Release, Dashboard/API image tag, chart `appVersion` | `v1.2.3`                           |
| Helm OCI chart version                                               | `1.2.3`                            |

Run the consistency gate after changing release metadata:

```bash
pnpm run version:check
```

CI and the publish workflow run the same gate. A tag build fails unless the tag
is exactly `v` followed by the committed `VERSION`.

## Branches and tags

- Development happens on `main`.
- Stabilization and patch releases use `release/vMAJOR.MINOR`.
- Releases use signed tags in the form `vMAJOR.MINOR.PATCH`.
- Prereleases append a SemVer suffix, for example `v1.2.0-rc.1`.

## Compatibility policy

Each Dashboard release targets the current and previous supported KubeLB minor
(`N` and `N-1`). A version is listed as supported only after the exact Dashboard
and KubeLB refs pass the compatibility suite. KubeLB release metadata selects an
existing Dashboard release; it never creates a Dashboard release automatically.

## Release process

1. Create or update `release/vMAJOR.MINOR` through a pull request.
2. Update `VERSION` and its committed mirrors: both package manifests,
   `Chart.yaml` `version`, and `Chart.yaml` `appVersion` with a leading `v`.
3. Run `pnpm run version:check` and the full release checks.
4. Merge the reviewed release preparation change.
5. Create and push a signed `vMAJOR.MINOR.PATCH` tag at that commit.
6. Let the publish workflow validate the tag and publish both images and the
   Helm chart from committed metadata.
7. Publish the GitHub Release only after all release artifacts and verification
   evidence are available. Its notes are the canonical changelog.

Release preparation and finalization remain manual until the follow-up release
automation tasks are implemented.
