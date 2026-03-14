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

import { queryKeys } from "@/api/query-keys";
import { useQuery } from "@tanstack/react-query";

type Edition = "ce" | "ee";

const STORAGE_KEY = "kubelb-edition";

function getCachedEdition(): Edition | undefined {
  const cached = localStorage.getItem(STORAGE_KEY);
  return cached === "ce" || cached === "ee" ? cached : undefined;
}

async function detectEdition(): Promise<Edition> {
  const res = await fetch("/api/kube/apis/kubelb.k8c.io/v1alpha1/wafpolicies");
  const edition = res.ok ? "ee" : "ce";
  localStorage.setItem(STORAGE_KEY, edition);
  return edition;
}

export function useEdition() {
  const { data: edition, isLoading } = useQuery({
    queryKey: queryKeys.edition.detect(),
    queryFn: detectEdition,
    initialData: getCachedEdition,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  return {
    edition: edition ?? "ce",
    isEE: edition === "ee",
    loading: isLoading,
  };
}
