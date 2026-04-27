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

import { useCallback, useEffect, useRef, useState } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import * as monaco from "monaco-editor";
import type { IDisposable } from "monaco-editor";
import type { configureMonacoYaml } from "monaco-yaml";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import YamlWorker from "monaco-yaml/yaml.worker?worker";

window.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === "yaml") return new YamlWorker();
    return new EditorWorker();
  },
};

loader.config({ monaco });
(globalThis as unknown as { monaco: typeof monaco }).monaco = monaco;

type MonacoInstance = Parameters<typeof configureMonacoYaml>[0];
type ConfigureFn = typeof configureMonacoYaml;

let yamlDisposable: IDisposable | null = null;
let configurePromise: Promise<ConfigureFn> | null = null;

function getConfigureFn(): Promise<ConfigureFn> {
  if (!configurePromise) {
    configurePromise = import("monaco-yaml").then((m) => m.configureMonacoYaml);
  }
  return configurePromise;
}

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

export default function YamlEditorInner({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  schema,
}: YamlEditorProps) {
  const theme = useMonacoTheme();
  const monacoRef = useRef<MonacoInstance | null>(null);
  const callIdRef = useRef(0);
  const initializedRef = useRef(false);

  const configureSchema = useCallback((monaco: MonacoInstance, s?: Record<string, unknown>) => {
    const callId = ++callIdRef.current;

    void getConfigureFn().then((configure) => {
      if (callIdRef.current !== callId) return;
      yamlDisposable?.dispose();
      yamlDisposable = configure(monaco, {
        enableSchemaRequest: false,
        schemas: s
          ? [
              {
                uri: "inmemory://schema/resource.json",
                fileMatch: ["*"],
                schema: s,
              },
            ]
          : [],
      });
    });
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (!monacoRef.current) return;
    configureSchema(monacoRef.current, schema);
  }, [schema, configureSchema]);

  const handleMount: OnMount = (_, monaco) => {
    monacoRef.current = monaco as MonacoInstance;
    configureSchema(monacoRef.current, schema);
    initializedRef.current = true;
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
