/*
 * Copyright 2026 The KubeLB Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const RFC1123_LABEL_REGEX = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const RFC1123_MAX_LENGTH = 63;

export function validateRFC1123Name(value: string): string | null {
  if (!value) return "Name is required";
  if (value !== value.toLowerCase()) return "Name must be lowercase";
  if (value.length > RFC1123_MAX_LENGTH)
    return `Name must not exceed ${RFC1123_MAX_LENGTH} characters`;
  if (!RFC1123_LABEL_REGEX.test(value))
    return "Must start and end with a lowercase letter or number, and may contain hyphens in between";
  return null;
}

export function validateOptionalRFC1123Name(value: string): string | null {
  if (!value) return null;
  return validateRFC1123Name(value);
}

const K8S_LABEL_KEY_REGEX =
  /^([a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*\/)?[a-zA-Z0-9]([-a-zA-Z0-9_.]*[a-zA-Z0-9])?$/;
const K8S_LABEL_VALUE_REGEX = /^([a-zA-Z0-9]([-a-zA-Z0-9_.]*[a-zA-Z0-9])?)?$/;
const K8S_LABEL_VALUE_MAX_LENGTH = 63;

export function validateLabelKey(value: string): string | null {
  if (!value) return null;
  if (value.length > 253) return "Label key must not exceed 253 characters";
  if (!K8S_LABEL_KEY_REGEX.test(value))
    return "Invalid label key format (e.g. app, example.com/tier)";
  return null;
}

export function validateLabelValue(value: string): string | null {
  if (!value) return null;
  if (value.length > K8S_LABEL_VALUE_MAX_LENGTH)
    return `Label value must not exceed ${K8S_LABEL_VALUE_MAX_LENGTH} characters`;
  if (!K8S_LABEL_VALUE_REGEX.test(value))
    return "Must start/end with alphanumeric, may contain hyphens, underscores, and dots";
  return null;
}
