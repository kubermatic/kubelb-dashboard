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

import {
  LayoutDashboard,
  Users,
  Network,
  Route,
  KeyRound,
  Shield,
  ShieldAlert,
  Settings,
  Server,
  GitBranch,
  Bot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  ee?: boolean;
  requiresAgentgateway?: boolean;
  children?: NavItem[];
}

export const navItems: NavItem[] = [
  { label: "Overview", to: "/", icon: LayoutDashboard },
  { label: "Tenants", to: "/tenants", icon: Users },
  {
    label: "Load Balancers",
    to: "/load-balancers",
    icon: Network,
    children: [{ label: "Services", to: "/load-balancers/services", icon: Server }],
  },
  {
    label: "Routes",
    to: "/routes",
    icon: Route,
    children: [{ label: "Downstream", to: "/routes/downstream", icon: GitBranch }],
  },
  { label: "Sync Secrets", to: "/sync-secrets", icon: KeyRound },
  { label: "Envoy Proxy", to: "/envoy-proxy", icon: Shield },
  { label: "Configuration", to: "/configuration", icon: Settings },
  { label: "WAF Policies", to: "/waf-policies", icon: ShieldAlert, ee: true },
  {
    label: "AI Gateway",
    to: "/ai-gateway",
    icon: Bot,
    ee: true,
    requiresAgentgateway: true,
  },
];
