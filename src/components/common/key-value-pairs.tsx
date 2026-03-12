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

interface KeyValuePairsProps {
  data?: Record<string, string>;
  emptyMessage?: string;
}

export function KeyValuePairs({ data, emptyMessage = "None" }: KeyValuePairsProps) {
  const entries = Object.entries(data ?? {});

  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="contents">
          <span className="font-medium text-muted-foreground">{key}</span>
          <span className="break-all">{value}</span>
        </div>
      ))}
    </div>
  );
}
