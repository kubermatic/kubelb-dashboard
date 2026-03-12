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

import { AlertCircle } from "lucide-react";
import { KubeApiError } from "@/api/kube";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QueryErrorProps {
  error: Error;
  onRetry?: () => void;
}

export function QueryError({ error, onRetry }: QueryErrorProps) {
  const isKubeError = error instanceof KubeApiError;

  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
        <AlertCircle className="size-10 text-destructive" />
        <div className="space-y-1">
          {isKubeError ? (
            <>
              <h3 className="text-lg font-semibold">
                {error.status.reason} ({String(error.code)})
              </h3>
              <p className="text-sm text-muted-foreground">{error.status.message}</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold">Request Failed</h3>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </>
          )}
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
