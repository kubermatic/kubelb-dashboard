# KubeLB Dashboard releases

The Dashboard follows independent [Semantic Versioning](https://semver.org/).
It does not automatically inherit the KubeLB version. See
[ADR 0001](adr/0001-independent-dashboard-releases.md) for the decision and its
compatibility implications.

## Version metadata

`charts/kubelb-dashboard/Chart.yaml` is the only committed version source.
Its `version` is SemVer without a leading `v`; its `appVersion` is the same
version with a leading `v`. Build metadata (`+...`) is not supported because it
cannot be represented in all published OCI tags. The private npm packages are
not published and do not carry the Dashboard release version.

| Consumer                                                | Representation for version `1.2.3` |
| ------------------------------------------------------- | ---------------------------------- |
| Helm chart version and Helm OCI chart version           | `1.2.3`                            |
| Chart `appVersion`, GitHub Release, images, and Git tag | `v1.2.3`                           |

Run the consistency gate after changing release metadata:

```bash
pnpm run version:check
```

CI and the publish workflow run the same gate. A tag build fails unless the tag
is exactly `v` followed by the chart version and matches `appVersion`.

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

The publish workflow does not yet run that cross-repository compatibility
matrix. Until it exists, release managers must not mark a Dashboard/KubeLB pair
as supported without separate evidence for the exact refs.

## Release process

### Prepare the reviewed change

Choose the version, update the two version fields in
`charts/kubelb-dashboard/Chart.yaml`, and write the release notes:

```bash
TARGET_VERSION=1.2.0-rc.1
mkdir -p docs/releases
$EDITOR charts/kubelb-dashboard/Chart.yaml
$EDITOR "docs/releases/v${TARGET_VERSION}.md"
pnpm run version:check
pnpm run test:release
```

For `1.2.0-rc.1`, set `version: 1.2.0-rc.1` and
`appVersion: "v1.2.0-rc.1"`. Summarize the user-visible changes since the
previous tag in the notes file. Review the two version fields and notes in a
normal pull request.

### Tag and publish

Before the first release, repository administrators must:

- protect `v*` tags with a ruleset that restricts creation to release managers;
- configure the `release` environment to accept protected `v*` tags only and
  require an approving release manager;
- give the registry account write access to the existing `helm-charts`
  repository; and
- enable immutable GitHub Releases after a successful prerelease validation.

Without the tag ruleset and protected environment, a repository writer could
run unreviewed tagged workflow code with publication credentials.

1. Merge the release metadata pull request into release/vMAJOR.MINOR.
2. Create a signed annotated vMAJOR.MINOR.PATCH tag at the reviewed commit.
3. Push the tag without moving or reusing any previous release tag.
4. The Publish workflow validates the committed version and reviewed notes.
5. It builds both multi-architecture images once under run-scoped staging tags
   with maximal BuildKit provenance.
6. It blocks HIGH or CRITICAL production dependency and per-platform exact-image
   findings before promoting consumer tags.
7. It generates per-platform Syft SPDX JSON SBOMs from the exact image digests,
   signs both images, and attaches SBOM and GitHub provenance attestations.
8. After both image jobs pass, it pushes the chart to the existing repository,
   then immediately signs and attests the exact chart digest.
9. The final job rehashes all downloaded SBOMs and independently verifies exact
   SBOM predicates, signatures, and provenance before creating the GitHub
   Release.
10. The release includes the chart package, SBOMs, vulnerability reports, the
    canonical release manifest, and its keyless Sigstore bundle.

Tag jobs are non-cancelling. A rerun refuses to mutate registry tags when the
GitHub Release or immutable artifact tag already exists. Recover with a new
reviewed version; do not delete or reuse a published version.

After merging the reviewed release change:

```bash
TARGET_VERSION=1.2.0-rc.1
git tag -s "v${TARGET_VERSION}" -m "KubeLB Dashboard v${TARGET_VERSION}"
git push upstream "v${TARGET_VERSION}"
```

### Vulnerability exceptions

Exceptions live in hack/vulnerability-exceptions.json. Each exception must name
one advisory and exact scope, plus a reason, owner, and expiry date. Expired,
duplicate, malformed, or severity-wide exceptions fail the build. Image
exceptions bind to the exact image digest, never a mutable tag.

### Failure recovery

If any scan, signing, attestation, or verification step fails, the GitHub Release
is not created. Run-scoped image tags are not supported release locations. If
an image or chart consumer tag was already published, do not delete, move, or
reuse it. Fix the cause through a new reviewed commit and release a new
prerelease or patch version.

Tag rulesets, environment protection, and immutable-release settings are
repository configuration and are intentionally not changed by the workflow.

## Consumer verification

Install Cosign and GitHub CLI, then verify exact digests from
release-manifest.json:

```bash
VERSION=1.2.0
TAG="v$VERSION"
IDENTITY="https://github.com/kubermatic/kubelb-dashboard/.github/workflows/publish.yml@refs/tags/$TAG"
ISSUER="https://token.actions.githubusercontent.com"

gh release download "$TAG" \
  --repo kubermatic/kubelb-dashboard \
  --dir "release-$TAG"

node hack/release-manifest.mjs check \
  --input "release-$TAG/release-manifest.json"

cosign verify-blob \
  --bundle "release-$TAG/release-manifest.sigstore.json" \
  --certificate-identity "$IDENTITY" \
  --certificate-oidc-issuer "$ISSUER" \
  "release-$TAG/release-manifest.json"

cosign verify \
  --certificate-identity "$IDENTITY" \
  --certificate-oidc-issuer "$ISSUER" \
  "quay.io/kubermatic/kubelb-dashboard@sha256:<dashboard-digest>"

cosign verify-attestation \
  --type spdxjson \
  --certificate-identity "$IDENTITY" \
  --certificate-oidc-issuer "$ISSUER" \
  "quay.io/kubermatic/kubelb-dashboard@sha256:<dashboard-digest>"

gh attestation verify \
  "oci://quay.io/kubermatic/kubelb-dashboard@sha256:<dashboard-digest>" \
  --repo kubermatic/kubelb-dashboard \
  --cert-identity "$IDENTITY"
```

Repeat the signature, SBOM, and provenance checks for the API image. Verify the
chart signature and provenance at its exact manifest digest. Air-gap export and
offline trusted-root distribution belong to the KubeLB product BOM workflow;
this repository does not claim an untested offline verification path.
