#!/usr/bin/env bash
#
# Wrapper around `npm audit --audit-level=high` that allows a known set of
# false-positive GHSAs to pass. Run from a package root (project root or api/).
#
# Allowed GHSAs — document why each is here and when to revisit:
#
#   GHSA-rmmr-r34h-pfm5 — @tanstack/history / router family
#     Advisory filed 2026-05-11 with `>=0` ranges after CVE-2026-45321.
#     Our pinned versions predate the malicious publish window (verified
#     by publish timestamps). Remove once TanStack republishes patched
#     versions and the advisory narrows its affected range.

set -euo pipefail

ALLOWED_GHSA=(
  GHSA-rmmr-r34h-pfm5
)

AUDIT_JSON=$(npm audit --audit-level=high --json || true)
export AUDIT_JSON
export ALLOWED="${ALLOWED_GHSA[*]}"

node <<'NODE'
const allowed = new Set((process.env.ALLOWED || '').split(/\s+/).filter(Boolean));
const audit = JSON.parse(process.env.AUDIT_JSON || '{}');
const vulns = audit.vulnerabilities || {};

const findings = new Set();
for (const v of Object.values(vulns)) {
  for (const via of (v.via || [])) {
    if (typeof via === 'object' && via.url) {
      findings.add(via.url.split('/').pop());
    }
  }
}

const unallowed = [...findings].filter(g => !allowed.has(g));
if (unallowed.length === 0) {
  if (findings.size > 0) {
    console.log(`npm audit OK — only allowed advisories present: ${[...findings].join(', ')}`);
  } else {
    console.log('npm audit OK — no findings.');
  }
  process.exit(0);
}

console.error('Unallowed npm audit advisories:');
for (const g of unallowed) console.error(`  - ${g}`);
console.error('\nRun `npm audit` locally to see details.');
process.exit(1);
NODE
