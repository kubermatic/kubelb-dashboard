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

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { RowActions } from "../row-actions";
import { visibleRowActions, type RowAction } from "../row-actions.helpers";

const mockUseReadOnly = vi.fn<() => boolean>();
vi.mock("@/hooks/use-read-only", () => ({ useReadOnly: () => mockUseReadOnly() }));

const actions: RowAction[] = [
  { label: "View YAML", onClick: vi.fn() },
  { label: "Edit", mutating: true, onClick: vi.fn() },
  { label: "Delete", mutating: true, variant: "destructive", onClick: vi.fn() },
];

describe("visibleRowActions", () => {
  it("keeps all actions when not read-only", () => {
    expect(visibleRowActions(actions, false)).toHaveLength(3);
  });

  it("drops mutating actions when read-only", () => {
    const visible = visibleRowActions(actions, true);
    expect(visible.map((a) => a.label)).toEqual(["View YAML"]);
  });
});

describe("RowActions", () => {
  it("renders the trigger when at least one action is visible", () => {
    mockUseReadOnly.mockReturnValue(true);
    const { queryByRole } = render(<RowActions actions={actions} />);
    expect(queryByRole("button")).not.toBeNull();
  });

  it("renders nothing when read-only and every action is mutating", () => {
    mockUseReadOnly.mockReturnValue(true);
    const mutatingOnly: RowAction[] = [
      { label: "Edit", mutating: true, onClick: vi.fn() },
      { label: "Delete", mutating: true, onClick: vi.fn() },
    ];
    const { container } = render(<RowActions actions={mutatingOnly} />);
    expect(container).toBeEmptyDOMElement();
  });
});
