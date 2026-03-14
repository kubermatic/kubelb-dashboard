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

import { useEffect, useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import type { IDisposable } from "monaco-editor";

interface YamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  schema?: Record<string, unknown>;
}

function useMonacoTheme() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "vs-dark" : "light",
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "vs-dark" : "light");
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

export function YamlEditor({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  schema,
}: YamlEditorProps) {
  const theme = useMonacoTheme();
  const disposableRef = useRef<IDisposable | null>(null);

  useEffect(() => {
    return () => {
      disposableRef.current?.dispose();
      disposableRef.current = null;
    };
  }, []);

  const handleMount: OnMount = (_, monaco) => {
    disposableRef.current?.dispose();

    window.MonacoEnvironment = {
      getWorker(_, label) {
        if (label === "yaml") {
          return new Worker(new URL("monaco-yaml/yaml.worker.js", import.meta.url), {
            type: "module",
          });
        }
        return new Worker(
          new URL("monaco-editor/esm/vs/editor/editor.worker.js", import.meta.url),
          { type: "module" },
        );
      },
    };

    void import("monaco-yaml").then(({ configureMonacoYaml }) => {
      disposableRef.current = configureMonacoYaml(
        monaco as Parameters<typeof configureMonacoYaml>[0],
        {
          enableSchemaRequest: false,
          schemas: schema
            ? [
                {
                  uri: "inmemory://schema/resource.json",
                  fileMatch: ["*"],
                  schema: schema as object,
                },
              ]
            : [],
        },
      );
    });
  };

  return (
    <Editor
      height={height}
      language="yaml"
      theme={theme}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      onMount={handleMount}
      loading={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      }
      options={{
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 13,
        folding: true,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        padding: { top: 8, bottom: 8 },
        overviewRulerLanes: 0,
        overviewRulerBorder: false,
        ...(readOnly && {
          lineNumbers: "off" as const,
          renderLineHighlight: "none" as const,
          domReadOnly: true,
        }),
      }}
    />
  );
}
