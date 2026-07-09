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

import { memo, useMemo } from "react";
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "@dagrejs/dagre";
import { Globe } from "lucide-react";
import type { TrafficGraphData } from "@/api/traffic";
import { namespaceColor } from "@/lib/traffic-colors";

const NODE_W = 210;
const NODE_H = 56;

interface NodeData extends Record<string, unknown> {
  name: string;
  namespace: string;
  kind: string;
  color: string;
  external: boolean;
}

const TrafficNodeCard = memo(({ data, selected }: NodeProps<Node<NodeData>>) => (
  <div
    className="flex h-full items-center gap-2 rounded-md border bg-card px-3 shadow-sm"
    style={{
      borderLeft: `4px solid ${data.color}`,
      outline: selected ? `2px solid ${data.color}` : undefined,
    }}
  >
    <Handle type="target" position={Position.Left} className="!bg-transparent !border-0" />
    {data.external ? (
      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
    ) : (
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: data.color }} />
    )}
    <div className="min-w-0">
      <div className="truncate text-sm font-medium">{data.name}</div>
      {data.namespace && (
        <div className="truncate text-xs text-muted-foreground">{data.namespace}</div>
      )}
    </div>
    <Handle type="source" position={Position.Right} className="!bg-transparent !border-0" />
  </div>
));
TrafficNodeCard.displayName = "TrafficNodeCard";

const nodeTypes = { traffic: TrafficNodeCard };

export type TrafficSelection =
  { type: "node"; id: string } | { type: "edge"; from: string; to: string };

export function TrafficGraphView({
  graph,
  namespaces,
  selection = null,
  onSelect,
}: {
  graph: TrafficGraphData;
  namespaces: string[];
  selection?: TrafficSelection | null;
  onSelect?: (s: TrafficSelection | null) => void;
}) {
  const base = useMemo(() => {
    const maxConn = Math.max(1, ...graph.edges.map((e) => e.connections));
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 140 });
    g.setDefaultEdgeLabel(() => ({}));
    graph.nodes.forEach((n) => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
    graph.edges.forEach((e) => g.setEdge(e.from, e.to));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    dagre.layout(g);

    const nodes: Node<NodeData>[] = graph.nodes.map((n) => {
      const p = g.node(n.id) as { x: number; y: number } | undefined;
      const external = n.namespace === "" && (n.name === "world" || n.name === "unknown");
      return {
        id: n.id,
        type: "traffic",
        position: { x: (p?.x ?? 0) - NODE_W / 2, y: (p?.y ?? 0) - NODE_H / 2 },
        width: NODE_W,
        height: NODE_H,
        data: {
          name: n.name,
          namespace: n.namespace,
          kind: n.kind,
          color: external ? "#94a3b8" : namespaceColor(n.namespace, namespaces),
          external,
        },
      };
    });
    const edges: Edge[] = graph.edges.map((e, i) => ({
      id: `e${i}`,
      source: e.from,
      target: e.to,
      type: "smoothstep",
      label:
        e.connections >= 1000 ? `${(e.connections / 1000).toFixed(1)}k` : String(e.connections),
      labelBgStyle: { fill: "var(--card)", fillOpacity: 0.85 },
      labelStyle: { fontSize: 10, fill: "var(--muted-foreground)" },
      style: {
        strokeWidth: 1 + (e.connections / maxConn) * 4,
        stroke: /DROPPED|ERROR/i.test(e.verdict) ? "#ef4444" : "var(--muted-foreground)",
        opacity: 0.5,
      },
    }));
    return { nodes, edges };
  }, [graph, namespaces]);

  const highlighted = useMemo(() => {
    if (!selection) return null;
    const nodes = new Set<string>();
    const edges = new Set<string>();
    graph.edges.forEach((e, i) => {
      const hit =
        selection.type === "node"
          ? e.from === selection.id || e.to === selection.id
          : e.from === selection.from && e.to === selection.to;
      if (hit) {
        edges.add(`e${i}`);
        nodes.add(e.from);
        nodes.add(e.to);
      }
    });
    if (selection.type === "node") nodes.add(selection.id);
    return { nodes, edges };
  }, [selection, graph]);

  const view = useMemo(() => {
    if (!highlighted) return base;
    const nodes = base.nodes.map((n) => ({
      ...n,
      selected: selection?.type === "node" && selection.id === n.id,
      style: { ...n.style, opacity: highlighted.nodes.has(n.id) ? 1 : 0.25 },
    }));
    const edges = base.edges.map((e) => ({
      ...e,
      style: { ...e.style, opacity: highlighted.edges.has(e.id) ? 0.95 : 0.08 },
    }));
    return { nodes, edges };
  }, [base, highlighted, selection]);

  if (base.nodes.length === 0) {
    return (
      <div className="flex h-[560px] items-center justify-center rounded-md border text-sm text-muted-foreground">
        No traffic matches the current filters.
      </div>
    );
  }

  return (
    <div className="h-[560px] w-full rounded-md border bg-card">
      <ReactFlow
        nodes={view.nodes}
        edges={view.edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
        nodesConnectable={false}
        edgesFocusable={false}
        onNodeClick={(_, n) => onSelect?.({ type: "node", id: n.id })}
        onEdgeClick={(_, e) => onSelect?.({ type: "edge", from: e.source, to: e.target })}
        onPaneClick={() => onSelect?.(null)}
      >
        <Background gap={20} className="!bg-transparent" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
