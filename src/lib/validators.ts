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
