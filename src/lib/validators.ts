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

const RFC1123_CHARS = /^[-a-z0-9]+$/;
const LABEL_NAME_CHARS = /^[-a-zA-Z0-9_.]+$/;
const RFC1123_MAX_LENGTH = 63;
const K8S_LABEL_VALUE_MAX_LENGTH = 63;

export function isRFC1123Label(value: string): boolean {
  return RFC1123_CHARS.test(value) && value[0] !== "-" && value[value.length - 1] !== "-";
}

function isAlphanumeric(ch: string): boolean {
  return /^[a-zA-Z0-9]$/.test(ch);
}

function isValidLabelName(value: string): boolean {
  return (
    LABEL_NAME_CHARS.test(value) &&
    isAlphanumeric(value[0]) &&
    isAlphanumeric(value[value.length - 1])
  );
}

export function validateRFC1123Name(value: string): string | null {
  if (!value) return "Name is required";
  if (value !== value.toLowerCase()) return "Name must be lowercase";
  if (value.length > RFC1123_MAX_LENGTH)
    return `Name must not exceed ${RFC1123_MAX_LENGTH} characters`;
  if (!isRFC1123Label(value))
    return "Must start and end with a lowercase letter or number, and may contain hyphens in between";
  return null;
}

export function validateOptionalRFC1123Name(value: string): string | null {
  if (!value) return null;
  return validateRFC1123Name(value);
}

export function validateLabelKey(value: string): string | null {
  if (!value) return null;
  if (value.length > 253) return "Label key must not exceed 253 characters";

  const slashIdx = value.indexOf("/");
  if (slashIdx !== -1) {
    const prefix = value.slice(0, slashIdx);
    const name = value.slice(slashIdx + 1);
    const validPrefix =
      prefix.length > 0 &&
      prefix.split(".").every((p) => p.length > 0 && p.length <= 63 && isRFC1123Label(p));
    if (!validPrefix || !name || name.length > 63 || !isValidLabelName(name))
      return "Invalid label key format (e.g. app, example.com/tier)";
  } else {
    if (value.length > 63 || !isValidLabelName(value))
      return "Invalid label key format (e.g. app, example.com/tier)";
  }
  return null;
}

export function validateLabelValue(value: string): string | null {
  if (!value) return null;
  if (value.length > K8S_LABEL_VALUE_MAX_LENGTH)
    return `Label value must not exceed ${K8S_LABEL_VALUE_MAX_LENGTH} characters`;
  if (!isValidLabelName(value))
    return "Must start/end with alphanumeric, may contain hyphens, underscores, and dots";
  return null;
}
