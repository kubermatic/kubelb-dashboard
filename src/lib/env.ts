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

import { z } from "zod";

const boolFlag = (trueWhen: "true" | "notFalse") =>
  z
    .string()
    .default(trueWhen === "true" ? "false" : "true")
    .transform((v) => (trueWhen === "true" ? v === "true" : v !== "false"));

const envSchema = z.object({
  VITE_API_URL: z.string().default(""),
  VITE_MOCK: boolFlag("true"),
  VITE_ENABLE_YAML_EDITOR: boolFlag("notFalse"),
  VITE_ENABLE_WATCH: boolFlag("notFalse"),
});

export const env = envSchema.parse(import.meta.env);
