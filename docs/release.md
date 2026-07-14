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

The publish workflow does not yet run that cross-repository compatibility
matrix. Until it exists, release managers must not mark a Dashboard/KubeLB pair
as supported without separate evidence for the exact refs.

## Release process

### Prepare the reviewed change

The Release Preparation workflow is read-only. Dispatch it with the proposed
version to inspect the deterministic plan without creating a branch or granting
write permissions:

```bash
gh workflow run release-prepare.yml -f version=1.2.0-rc.1
```

Prepare the actual change from a fork or trusted local checkout:

```bash
TARGET_VERSION=1.2.0-rc.1
gh api --paginate --slurp \
  "repos/kubermatic/kubelb-dashboard/pulls?state=closed&per_page=100" \
  > /tmp/kubelb-dashboard-pulls.json
mkdir -p docs/releases
pnpm run release:prepare -- \
  --version "$TARGET_VERSION" \
  --pulls /tmp/kubelb-dashboard-pulls.json \
  --output "docs/releases/v${TARGET_VERSION}.md"
pnpm run version:check
pnpm run test:release
```

The command updates VERSION, both package manifests, and Helm chart metadata. It
selects the nearest reachable SemVer tag and extracts non-empty release-note
blocks from merged pull requests in that range. Review the generated notes and
metadata in a normal pull request. Do not hand-edit generated notes after review.

### Tag and publish

Before the first release, repository administrators must:

- protect `v*` tags with a ruleset that restricts creation to release managers;
- configure the `release` environment to accept protected `v*` tags only and
  require an approving release manager;
- give the registry account write access to both `helm-charts-staging` and
  `helm-charts` repositories; and
- enable immutable GitHub Releases after a successful prerelease validation.

Without the tag ruleset and protected environment, a repository writer could
run unreviewed tagged workflow code with publication credentials.

1. Merge the release-preparation pull request into release/vMAJOR.MINOR.
2. Create a signed annotated vMAJOR.MINOR.PATCH tag at the reviewed commit.
3. Push the tag without moving or reusing any previous release tag.
4. The Publish workflow validates the committed version and reviewed notes.
5. It builds both multi-architecture images once under run-scoped staging tags
   with maximal BuildKit provenance.
6. It blocks HIGH or CRITICAL production dependency and per-platform exact-image
   findings before promoting consumer tags.
7. It generates per-platform Syft SPDX JSON SBOMs from the exact image digests,
   signs both images, and attaches SBOM and GitHub provenance attestations.
8. It stages and signs the chart, then recursively promotes the signed OCI
   artifact to the consumer repository.
9. The final job rehashes all downloaded SBOMs and independently verifies exact
   SBOM predicates, signatures, and provenance before creating the GitHub
   Release.
10. The release includes the chart package, SBOMs, vulnerability reports, the
    canonical release manifest, and its keyless Sigstore bundle.

Tag jobs are non-cancelling. A rerun refuses to mutate registry tags when the
GitHub Release or immutable artifact tag already exists. Recover with a new
reviewed version; do not delete or reuse a published version.

### Vulnerability exceptions

Exceptions live in hack/vulnerability-exceptions.json. Each exception must name
one advisory and exact scope, plus a reason, owner, and expiry date. Expired,
duplicate, malformed, or severity-wide exceptions fail the build. Image
exceptions bind to the exact image digest, never a mutable tag.

### Failure recovery

If any scan, signing, attestation, or verification step fails, the GitHub Release
is not created. Run-scoped image tags and the staging chart repository are not
supported release locations. If consumer tags were already promoted, do not
delete, move, or reuse them. Fix the cause through a new reviewed commit and
release a new prerelease or patch version.

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
