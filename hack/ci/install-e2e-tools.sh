#!/usr/bin/env bash

# Copyright 2026 The KubeLB Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

readonly KIND_VERSION="v0.31.0"
readonly KIND_SHA256="eb244cbafcc157dff60cf68693c14c9a75c4e6e6fedaf9cd71c58117cb93e3fa"
readonly YQ_VERSION="v4.53.3"
readonly YQ_SHA256="fa52a4e758c63d38299163fbdd1edfb4c4963247918bf9c1c5d31d84789eded4"

install_tool() {
  local name="$1"
  local url="$2"
  local checksum="$3"
  local target="${RUNNER_TEMP:-/tmp}/${name}"

  curl --fail --location --silent --show-error --output "$target" "$url"
  printf '%s  %s\n' "$checksum" "$target" | sha256sum --check --status
  sudo install -m 0755 "$target" "/usr/local/bin/${name}"
}

install_tool \
  kind \
  "https://github.com/kubernetes-sigs/kind/releases/download/${KIND_VERSION}/kind-linux-amd64" \
  "$KIND_SHA256"
install_tool \
  yq \
  "https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64" \
  "$YQ_SHA256"
