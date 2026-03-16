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

- **Artifact Signing**: Container images and Helm charts are signed with [Sigstore Cosign](https://github.com/sigstore/cosign) using keyless signing on tagged releases
- **SBOMs**: Docker BuildKit SBOMs are generated for all container images (`sbom: true`)
- **Dependency Management**: Dependabot monitors npm, GitHub Actions, and Docker dependencies with weekly updates
- **Immutable Releases**: GitHub releases are immutable — assets cannot be modified after publication

### Verification

Verify artifact signatures before deployment:

```bash
# Verify dashboard image
cosign verify quay.io/kubermatic/kubelb-dashboard:v0.1.0 \
  --certificate-identity-regexp="^https://github.com/kubermatic/kubelb-dashboard/.github/workflows/publish.yml@refs/tags/v.*" \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com

# Verify API image
cosign verify quay.io/kubermatic/kubelb-dashboard-api:v0.1.0 \
  --certificate-identity-regexp="^https://github.com/kubermatic/kubelb-dashboard/.github/workflows/publish.yml@refs/tags/v.*" \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com

# Verify Helm chart
cosign verify quay.io/kubermatic/helm-charts/kubelb-dashboard:v0.1.0 \
  --certificate-identity-regexp="^https://github.com/kubermatic/kubelb-dashboard/.github/workflows/publish.yml@refs/tags/v.*" \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com
```

## Embargo Policy

Security vulnerabilities are handled under embargo until:

- A fix is available and tested
- Affected users have been notified (if applicable)
- A coordinated disclosure date is agreed upon

Embargo violations may result in exclusion from future security communications.
