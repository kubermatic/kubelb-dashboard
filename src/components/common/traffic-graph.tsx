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

import { useMemo } from "react";
import { Globe } from "lucide-react";
import { tenantColor, type TrafficGraph, type TrafficNode } from "@/lib/traffic-graph";

const COL_X = { internet: 40, loadbalancer: 300, backend: 620 };
const NODE_W = 190;
const NODE_H = 44;
const ROW_GAP = 16;
const TOP_PAD = 24;

interface Placed extends TrafficNode {
  x: number;
  y: number;
}

export function TrafficGraphView({ graph }: { graph: TrafficGraph }) {
  const { placed, edges, width, height } = useMemo(() => {
    const lbs = graph.nodes.filter((n) => n.kind === "loadbalancer");
    const positions = new Map<string, Placed>();

    // Backends grouped by their parent LB, in LB order → minimal edge crossing.
    const backendsByLb = new Map<string, TrafficNode[]>();
    for (const e of graph.edges) {
      const target = graph.nodes.find((n) => n.id === e.to);
      if (target?.kind === "backend") {
        const arr = backendsByLb.get(e.from) ?? [];
        arr.push(target);
        backendsByLb.set(e.from, arr);
      }
    }

    let lbY = TOP_PAD;
    let beY = TOP_PAD;
    for (const lb of lbs) {
      const bes = backendsByLb.get(lb.id) ?? [];
      // Center the LB against its block of backends for a tidy flow.
      const blockH = Math.max(1, bes.length) * (NODE_H + ROW_GAP);
      const lbCenter = beY + blockH / 2 - (NODE_H + ROW_GAP) / 2;
      positions.set(lb.id, { ...lb, x: COL_X.loadbalancer, y: Math.max(lbY, lbCenter) });
      for (const be of bes) {
        positions.set(be.id, { ...be, x: COL_X.backend, y: beY });
        beY += NODE_H + ROW_GAP;
      }
      if (bes.length === 0) beY += NODE_H + ROW_GAP;
      lbY = Math.max(lbY, positions.get(lb.id)!.y) + NODE_H + ROW_GAP;
    }

    const contentH = Math.max(lbY, beY, TOP_PAD + NODE_H) + TOP_PAD;
    const internet = graph.nodes.find((n) => n.kind === "internet");
    if (internet) {
      positions.set(internet.id, {
        ...internet,
        x: COL_X.internet,
        y: contentH / 2 - NODE_H / 2,
      });
    }

    const drawnEdges = graph.edges
      .map((e) => ({ a: positions.get(e.from), b: positions.get(e.to) }))
      .filter((e): e is { a: Placed; b: Placed } => !!e.a && !!e.b);

    return {
      placed: [...positions.values()],
      edges: drawnEdges,
      width: COL_X.backend + NODE_W + 40,
      height: contentH,
    };
  }, [graph]);

  return (
    <div className="overflow-auto rounded-md border">
      <svg width={width} height={height} className="min-w-full">
        {edges.map((e, i) => {
          const x1 = e.a.x + NODE_W;
          const y1 = e.a.y + NODE_H / 2;
          const x2 = e.b.x;
          const y2 = e.b.y + NODE_H / 2;
          const mx = (x1 + x2) / 2;
          const color =
            e.b.namespace != null
              ? tenantColor(e.b.namespace, graph.namespaces)
              : "var(--muted-foreground)";
          return (
            <path
              key={i}
              d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`}
              fill="none"
              stroke={color}
              strokeWidth={1.25}
              strokeOpacity={0.5}
            />
          );
        })}
        {placed.map((n) => (
          <Node key={n.id} node={n} namespaces={graph.namespaces} />
        ))}
      </svg>
    </div>
  );
}

function Node({ node, namespaces }: { node: Placed; namespaces: string[] }) {
  const accent =
    node.namespace != null ? tenantColor(node.namespace, namespaces) : "var(--muted-foreground)";
  return (
    <g transform={`translate(${node.x},${node.y})`}>
      <rect
        width={NODE_W}
        height={NODE_H}
        rx={6}
        className="fill-card stroke-border"
        strokeWidth={1}
      />
      <rect width={4} height={NODE_H} rx={2} fill={accent} />
      {node.kind === "internet" && (
        <foreignObject x={12} y={NODE_H / 2 - 8} width={16} height={16}>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </foreignObject>
      )}
      <text
        x={node.kind === "internet" ? 34 : 14}
        y={node.sub ? 19 : 27}
        className="fill-foreground text-[12px] font-medium"
      >
        {truncate(node.label, 24)}
      </text>
      {node.sub && (
        <text
          x={node.kind === "internet" ? 34 : 14}
          y={34}
          className="fill-muted-foreground text-[10px]"
        >
          {truncate(node.sub, 28)}
        </text>
      )}
    </g>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
