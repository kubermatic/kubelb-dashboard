#!/usr/bin/env bash

set -euo pipefail

ALLOWED_LICENSES="MIT;ISC;BSD-2-Clause;BSD-3-Clause;Apache-2.0;0BSD;Zlib;Unlicense"

LICENSE_CHECK_OUTPUT=$(npx license-compliance --production --allow "${ALLOWED_LICENSES}" -r detailed)

if [[ ${?} == 1 ]]; then
  echo "${LICENSE_CHECK_OUTPUT}"
  echo -e "\nLicense check: FAILED\n" 1>&2
  exit 1
fi

echo -e "License check: OK\n"
