# Monaco YAML Editor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the plain `<Textarea>` YAML editor and `<pre>` YAML viewer with Monaco + `monaco-yaml` for syntax highlighting, schema-aware autocomplete, and inline validation.

**Architecture:** Single shared `YamlEditor` component wrapping `@monaco-editor/react` + `monaco-yaml`. Used in two places: `ResourceFormDialog` (read-write, YAML tab) and `YamlViewer` (read-only, Sheet panel). Monaco lazy-loaded via React.lazy to avoid bloating initial bundle. Theme syncs with app dark/light mode via `document.documentElement.classList.contains("dark")`.

**Tech Stack:** `@monaco-editor/react`, `monaco-yaml`, `monaco-editor` (peer dep)

---

### Task 1: Install Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install Monaco packages**

Run:

```bash
npm install @monaco-editor/react monaco-yaml monaco-editor
```

**Step 2: Verify install succeeded**

Run: `npm ls @monaco-editor/react monaco-yaml monaco-editor`
Expected: All three listed without UNMET PEER DEPENDENCY errors

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add monaco editor dependencies"
```

---

### Task 2: Create YamlEditor Component

**Files:**

- Create: `src/components/common/yaml-editor.tsx`

**Step 1: Create the component**

```tsx
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
import type { editor } from "monaco-editor";
import { Loader2 } from "lucide-react";

interface YamlEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  height?: string;
  schema?: Record<string, unknown>;
}

let monacoYamlConfigured = false;

export function YamlEditor({
  value,
  onChange,
  readOnly = false,
  height = "400px",
  schema,
}: YamlEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const handleMount: OnMount = async (editor, monaco) => {
    editorRef.current = editor;

    if (!monacoYamlConfigured) {
      const { configureMonacoYaml } = await import("monaco-yaml");
      configureMonacoYaml(monaco, {
        enableSchemaRequest: false,
        schemas: schema
          ? [
              {
                uri: "https://kubelb.k8c.io/schema/resource.json",
                fileMatch: ["*"],
                schema: schema as Record<string, unknown>,
              },
            ]
          : [],
      });
      monacoYamlConfigured = true;
    }
  };

  return (
    <Editor
      height={height}
      language="yaml"
      theme={dark ? "vs-dark" : "light"}
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
        lineNumbers: readOnly ? "off" : "on",
        renderLineHighlight: readOnly ? "none" : "line",
        folding: true,
        wordWrap: "on",
        automaticLayout: true,
        tabSize: 2,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        padding: { top: 8, bottom: 8 },
        domReadOnly: readOnly,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        overviewRulerBorder: false,
      }}
    />
  );
}
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: No errors related to `yaml-editor.tsx`

**Step 3: Commit**

```bash
git add src/components/common/yaml-editor.tsx
git commit -m "feat: add YamlEditor component with Monaco + monaco-yaml"
```

---

### Task 3: Handle monaco-yaml Worker Setup

`monaco-yaml` requires a web worker for YAML language features. Vite needs configuration to handle this.

**Files:**

- Modify: `vite.config.ts`

**Step 1: Check if monaco-yaml works without explicit worker config**

Run: `npm run dev:mock`

Open browser, navigate to a resource list page (e.g. `/tenants`), open browser console.
If you see worker-related errors about YAML, proceed with Step 2. If no errors, skip to Task 4.

**Step 2: Add Vite worker config if needed**

In `vite.config.ts`, add to the config object:

```ts
optimizeDeps: {
  include: ["monaco-editor", "monaco-yaml"],
},
```

**Important:** `@monaco-editor/react` handles the main Monaco worker setup automatically. `monaco-yaml` may need its own worker — check the `monaco-yaml` README for Vite-specific setup. The dynamic import in `handleMount` should handle this, but if not, the `monaco-yaml` package exports a worker URL that needs to be registered.

**Step 3: Verify dev server starts without worker errors**

Run: `npm run dev:mock`
Expected: No console errors about workers

**Step 4: Commit if changes were needed**

```bash
git add vite.config.ts
git commit -m "chore: configure Vite for monaco-yaml workers"
```

---

### Task 4: Swap YamlEditor into ResourceFormDialog

**Files:**

- Modify: `src/components/common/resource-form-dialog.tsx`

**Step 1: Replace Textarea with YamlEditor in the YAML tab**

Key changes to `resource-form-dialog.tsx`:

- Remove `Textarea` import (if only used here — check first)
- Import `YamlEditor` from `@/components/common/yaml-editor`
- In the YAML `TabsContent`, replace:

```tsx
{
  /* OLD */
}
<Textarea
  className="min-h-[200px] flex-1 resize-y font-mono text-sm"
  value={yamlValue}
  onChange={(e) => {
    setYamlValue(e.target.value);
    setYamlError(null);
  }}
  spellCheck={false}
/>;
{
  yamlError && <p className="mt-2 text-sm text-destructive">{yamlError}</p>;
}
```

with:

```tsx
{
  /* NEW */
}
<YamlEditor
  value={yamlValue}
  onChange={(v) => {
    setYamlValue(v);
    setYamlError(null);
  }}
  schema={schema}
  height="400px"
/>;
{
  yamlError && <p className="mt-2 text-sm text-destructive">{yamlError}</p>;
}
```

- Pass `schema` prop through — `ResourceFormDialog` already receives `schema?: RJSFSchema` which is a JSON Schema object, compatible with `monaco-yaml`.

**Step 2: Verify typecheck**

Run: `npm run typecheck`

**Step 3: Manual test**

Run: `npm run dev:mock`

1. Go to `/tenants`
2. Click "Create Tenant"
3. Switch to YAML tab
4. Verify: Monaco editor renders with YAML syntax highlighting
5. Verify: typing YAML works, no console errors
6. Verify: switch back to Form tab, data syncs
7. Verify: submit from YAML tab works

**Step 4: Commit**

```bash
git add src/components/common/resource-form-dialog.tsx
git commit -m "feat: replace textarea with Monaco YAML editor in form dialog"
```

---

### Task 5: Swap YamlEditor into YamlViewer

**Files:**

- Modify: `src/components/common/yaml-viewer.tsx`

**Step 1: Replace pre tag with read-only YamlEditor**

Replace the content area in `yaml-viewer.tsx`:

```tsx
{
  /* OLD */
}
<div className="flex-1 overflow-auto rounded-md bg-muted p-4">
  <pre className="font-mono text-sm text-foreground">{yaml}</pre>
</div>;
```

with:

```tsx
{
  /* NEW */
}
<div className="flex-1 overflow-hidden rounded-md border">
  <YamlEditor value={yaml} readOnly height="100%" />
</div>;
```

Import `YamlEditor` from `@/components/common/yaml-editor`.

The `height="100%"` makes Monaco fill the Sheet panel. The parent `div` needs `overflow-hidden` so Monaco handles its own scrolling.

**Step 2: Verify typecheck**

Run: `npm run typecheck`

**Step 3: Manual test**

Run: `npm run dev:mock`

1. Go to `/tenants`
2. Click row actions → "View YAML" on any tenant
3. Verify: Monaco editor renders read-only with syntax highlighting
4. Verify: no line numbers (readOnly config)
5. Verify: copy button still works
6. Verify: Sheet opens/closes cleanly, no orphaned Monaco instances

**Step 4: Commit**

```bash
git add src/components/common/yaml-viewer.tsx
git commit -m "feat: replace pre tag with Monaco read-only editor in YAML viewer"
```

---

### Task 6: Dark/Light Theme Sync

**Files:**

- Modify: `src/components/common/yaml-editor.tsx` (already has MutationObserver — verify it works)

**Step 1: Manual test**

Run: `npm run dev:mock`

1. Open YAML viewer or form YAML tab
2. Toggle dark/light mode via header button
3. Verify: Monaco theme switches between `vs-dark` and `light` immediately
4. Verify: no flicker or stale theme

If the MutationObserver approach from Task 2 works, no code changes needed. If the theme doesn't sync, the observer may need to watch a different attribute — check what `document.documentElement.classList.toggle("dark", dark)` in `header.tsx` actually does.

**Step 2: Commit if changes needed**

```bash
git add src/components/common/yaml-editor.tsx
git commit -m "fix: sync Monaco theme with app dark/light mode"
```

---

### Task 7: Schema Update Handling

The `monacoYamlConfigured` flag in Task 2 prevents re-configuration when the component re-mounts, but it also means schema changes (different CRD) won't take effect. Fix this.

**Files:**

- Modify: `src/components/common/yaml-editor.tsx`

**Step 1: Refactor to support schema updates**

Replace the `monacoYamlConfigured` flag approach with a ref that stores the `monaco-yaml` disposable:

```tsx
const monacoYamlRef = useRef<{ dispose: () => void } | null>(null);

const handleMount: OnMount = async (editor, monaco) => {
  editorRef.current = editor;
  const { configureMonacoYaml } = await import("monaco-yaml");

  monacoYamlRef.current?.dispose();
  monacoYamlRef.current = configureMonacoYaml(monaco, {
    enableSchemaRequest: false,
    schemas: schema
      ? [
          {
            uri: "https://kubelb.k8c.io/schema/resource.json",
            fileMatch: ["*"],
            schema: schema as Record<string, unknown>,
          },
        ]
      : [],
  });
};
```

Remove the module-level `let monacoYamlConfigured = false;`.

Add cleanup:

```tsx
useEffect(() => {
  return () => {
    monacoYamlRef.current?.dispose();
  };
}, []);
```

**Step 2: Verify typecheck**

Run: `npm run typecheck`

**Step 3: Manual test**

1. Open Tenant create → YAML tab (schema A)
2. Close, open WAF Policy create → YAML tab (schema B)
3. Verify: autocomplete suggestions match the WAF Policy schema, not Tenant

**Step 4: Commit**

```bash
git add src/components/common/yaml-editor.tsx
git commit -m "fix: support schema updates across different resource forms"
```

---

### Task 8: Build Verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds. Monaco is chunked separately by Vite (check output for chunk sizes).

**Step 2: Check bundle**

Look at Vite build output for Monaco-related chunks. Expected: Monaco in separate chunks, not in main bundle. If chunks are excessively large (>5MB), consider adding to `vite.config.ts`:

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        monaco: ["monaco-editor"],
      },
    },
  },
},
```

**Step 3: Run lint + format**

Run: `npm run lint:fix && npm run format`

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: build verification and lint fixes"
```

---

## Notes

- `monaco-yaml` `configureMonacoYaml()` returns a disposable — must call `.dispose()` on cleanup to avoid memory leaks
- Monaco creates web workers — Vite handles this automatically for `monaco-editor` but `monaco-yaml` has its own YAML worker. The dynamic import approach should handle it but watch for console errors
- The `YamlViewer` is used in **15 route files** — all get the upgrade automatically since they import the component
- `ResourceFormDialog` has the `schema` prop already — just pass it through to `YamlEditor`
- Dark mode uses `document.documentElement.classList.contains("dark")` — MutationObserver watches for class changes
- The `YamlEditor` component doesn't need to be lazy-loaded separately since `@monaco-editor/react` already handles lazy loading of Monaco internally via its `loader` — it only downloads Monaco when the `<Editor>` component first mounts
