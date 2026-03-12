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

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Card className="max-w-md">
              <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
                <AlertTriangle className="size-10 text-destructive" />
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold">Something went wrong</h2>
                  <p className="text-sm text-muted-foreground">
                    {this.state.error?.message ?? "An unexpected error occurred."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
