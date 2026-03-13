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

let cachedAuth: { authenticated: boolean; checkedAt: number } | null = null;
const AUTH_CACHE_TTL = 5 * 60 * 1000;

export async function checkAuth(): Promise<boolean> {
  if (cachedAuth && Date.now() - cachedAuth.checkedAt < AUTH_CACHE_TTL) {
    return cachedAuth.authenticated;
  }

  try {
    const response = await fetch("/auth/session", { credentials: "include" });
    if (!response.ok) return false;

    const data = (await response.json()) as { authenticated: boolean };
    cachedAuth = { authenticated: data.authenticated, checkedAt: Date.now() };
    return data.authenticated;
  } catch {
    return false;
  }
}

export function invalidateAuthCache(): void {
  cachedAuth = null;
}
