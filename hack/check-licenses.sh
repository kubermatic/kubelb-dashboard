#!/usr/bin/env bash

set -euo pipefail

ALLOWED_LICENSES=(
  MIT
  ISC
  BSD-2-Clause
  BSD-3-Clause
  Apache-2.0
  0BSD
  Zlib
  Unlicense
  Python-2.0
  CC-BY-4.0
  BlueOak-1.0.0
)

LICENSES_JSON=$(pnpm licenses list --prod --json)

DISALLOWED=$(node --input-type=module -e "
const data = JSON.parse(process.argv[1]);
const allowed = new Set(process.argv[2].split(','));

// Accept an SPDX expression if any \`OR\` alternative is in the allowlist.
// Conservative on \`AND\`: require every operand to be allowed.
function isAllowed(expr) {
  expr = expr.trim().replace(/^\(|\)$/g, '');
  if (allowed.has(expr)) return true;
  if (expr.includes(' OR ')) {
    return expr.split(/\s+OR\s+/).some(isAllowed);
  }
  if (expr.includes(' AND ')) {
    return expr.split(/\s+AND\s+/).every(isAllowed);
  }
  return false;
}

const violations = [];
for (const [license, pkgs] of Object.entries(data)) {
  if (isAllowed(license)) continue;
  for (const pkg of pkgs) {
    violations.push(\`\${pkg.name}@\${pkg.versions.join(',')} — \${license}\`);
  }
}
if (violations.length) console.log(violations.join('\n'));
" "${LICENSES_JSON}" "$(IFS=,; echo "${ALLOWED_LICENSES[*]}")")

if [[ -n "${DISALLOWED}" ]]; then
  echo "Disallowed licenses found:"
  echo "${DISALLOWED}"
  echo -e "\nLicense check: FAILED\n" 1>&2
  exit 1
fi

echo -e "License check: OK\n"
