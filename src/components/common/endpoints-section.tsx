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

import { CopyButton } from "@/components/common/copy-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddresses } from "@/hooks/use-addresses";
import type { EndpointAddress, EndpointPort, LoadBalancerEndpoints } from "@/types/kubelb";

function ResolvedAddresses({
  namespace,
  name,
  ports,
}: {
  namespace: string;
  name: string;
  ports: EndpointPort[];
}) {
  const { data, isLoading, isError } = useAddresses(namespace, name);

  if (isLoading) return <Skeleton className="h-5 w-48" />;
  if (isError || !data?.spec.addresses?.length) {
    return (
      <span className="text-sm text-muted-foreground">
        ref: {name} {isError ? "(failed to resolve)" : "(no addresses)"}
      </span>
    );
  }

  return <AddressPortGrid addresses={data.spec.addresses} ports={ports} />;
}

function AddressPortGrid({
  addresses,
  ports,
}: {
  addresses: EndpointAddress[];
  ports: EndpointPort[];
}) {
  if (ports.length === 0) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {addresses.map((addr, i) => {
          const display = addr.ip + (addr.hostname ? ` (${addr.hostname})` : "");
          return (
            <Badge
              key={i}
              variant="outline"
              className="inline-flex items-center gap-1 font-mono text-xs"
            >
              {display}
              <CopyButton value={addr.ip} />
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {ports.map((port, pi) => (
        <div key={pi} className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {port.name ? `${port.name} ` : ""}
              {port.port}/{port.protocol ?? "TCP"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-1">
            {addresses.map((addr, ai) => {
              const endpoint = `${addr.hostname ?? addr.ip}:${String(port.port)}`;
              return (
                <Badge
                  key={ai}
                  variant="outline"
                  className="inline-flex items-center gap-1 font-mono text-xs"
                >
                  {endpoint}
                  <CopyButton value={endpoint} />
                </Badge>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EndpointGroup({ ep, namespace }: { ep: LoadBalancerEndpoints; namespace: string }) {
  const hasRef = !!ep.addressesReference?.name;
  const hasInline = !!ep.addresses?.length;

  return (
    <div className="space-y-2">
      {ep.name && <p className="text-sm font-medium">{ep.name}</p>}
      {hasRef ? (
        <ResolvedAddresses
          namespace={ep.addressesReference!.namespace ?? namespace}
          name={ep.addressesReference!.name!}
          ports={ep.ports ?? []}
        />
      ) : hasInline ? (
        <AddressPortGrid addresses={ep.addresses!} ports={ep.ports ?? []} />
      ) : (
        <span className="text-sm text-muted-foreground">No addresses configured</span>
      )}
    </div>
  );
}

export function EndpointsSection({
  endpoints,
  namespace,
}: {
  endpoints?: LoadBalancerEndpoints[];
  namespace: string;
}) {
  if (!endpoints?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Endpoints</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {endpoints.map((ep, i) => (
          <EndpointGroup key={i} ep={ep} namespace={namespace} />
        ))}
      </CardContent>
    </Card>
  );
}
