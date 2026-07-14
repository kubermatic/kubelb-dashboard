# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in KubeLB Dashboard, please report it privately:

**Email**: <security@kubermatic.com>

**Please include:**

- Description and potential impact
- Steps to reproduce
- Affected versions
- Suggested remediation (if any)

**Response timeline:**

- Acknowledgment within 48 hours
- Initial assessment within 7 days
- Regular updates on remediation progress

We follow coordinated disclosure practices. Please do not disclose vulnerabilities publicly until we have released a fix and coordinated disclosure timing.

## Supported Versions

| Version              | Supported                  |
| -------------------- | -------------------------- |
| Latest stable        | Yes                        |
| Previous minor (n-1) | 3 months after new release |
| Older versions       | No                         |

## Security Measures

### Supply Chain Security

- **Artifact signing**: Tagged image and chart digests use keyless Sigstore
  Cosign signatures.
- **SBOMs**: Tagged image digests have Syft SPDX JSON SBOM attestations and
  matching GitHub Release assets.
- **Provenance**: Images request maximal BuildKit provenance; images and charts
  also receive GitHub build-provenance attestations bound to exact digests.
- **Vulnerability policy**: HIGH and CRITICAL production dependency and exact
  release-image findings block consumer-tag promotion unless a scoped, owned, expiring
  exception exists.
- **Dependency management**: Dependabot monitors root and API npm, GitHub
  Actions, and both Dockerfiles with weekly updates.
- **Release integrity**: GitHub Releases are created only after independent
  signature, SBOM, provenance, manifest, and asset verification. Protected
  `v*` tags, the protected `release` environment, and immutable GitHub Releases
  are mandatory repository controls.

### Verification

Use the exact digests in the signed release manifest. The tested image, chart,
SBOM, provenance, and manifest commands are documented in
[the release guide](docs/release.md#consumer-verification).

## Embargo Policy

Security vulnerabilities are handled under embargo until:

- A fix is available and tested
- Affected users have been notified (if applicable)
- A coordinated disclosure date is agreed upon

Embargo violations may result in exclusion from future security communications.
