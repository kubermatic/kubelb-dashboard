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

import type { Condition, ObjectMeta, ObjectReference } from "./kubernetes";

// LoadBalancer

export interface EndpointAddress {
  ip: string;
  hostname?: string;
}

export interface EndpointPort {
  name?: string;
  port: number;
  protocol?: "TCP" | "UDP";
}

export interface LoadBalancerEndpoints {
  name?: string;
  addresses?: EndpointAddress[];
  addressesReference?: ObjectReference;
  ports?: EndpointPort[];
}

export interface LoadBalancerPort {
  name?: string;
  protocol?: "TCP" | "UDP";
  port: number;
}

export interface ServicePort {
  name?: string;
  protocol?: string;
  port?: number;
  targetPort?: number | string;
  nodePort?: number;
  upstreamTargetPort?: number;
}

export interface HostnameStatus {
  hostname?: string;
  tlsEnabled?: boolean;
  dnsRecordCreated?: boolean;
}

export interface LoadBalancerStatus {
  loadBalancer?: { ingress?: Array<{ ip?: string; hostname?: string }> };
  service?: { ports?: ServicePort[] };
  hostname?: HostnameStatus;
}

export interface LoadBalancerSpec {
  endpoints?: LoadBalancerEndpoints[];
  ports?: LoadBalancerPort[];
  hostname?: string;
  type?: "ClusterIP" | "NodePort" | "LoadBalancer" | "ExternalName";
  externalTrafficPolicy?: "Cluster" | "Local";
}

export interface LoadBalancer {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  spec: LoadBalancerSpec;
  status?: LoadBalancerStatus;
}

// Route

export interface KubernetesSource {
  resource?: Record<string, unknown>;
  services?: Array<Record<string, unknown>>;
}

export interface RouteSource {
  kubernetes?: KubernetesSource;
}

export interface RouteSpec {
  endpoints?: LoadBalancerEndpoints[];
  source?: RouteSource;
}

export interface RouteServiceStatus {
  apiVersion?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  generatedName?: string;
  status?: Record<string, unknown>;
  conditions?: Condition[];
  ports?: ServicePort[];
}

export interface ResourceState {
  apiVersion?: string;
  kind?: string;
  name?: string;
  namespace?: string;
  generatedName?: string;
  status?: Record<string, unknown>;
  conditions?: Condition[];
}

export interface RouteResourcesStatus {
  source?: string;
  services?: Record<string, RouteServiceStatus>;
  route?: ResourceState;
}

export interface RouteStatus {
  resources?: RouteResourcesStatus;
}

export interface Route {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  spec: RouteSpec;
  status?: RouteStatus;
}

// Tenant

export interface LoadBalancerSettings {
  class?: string;
  limit?: number;
  disable?: boolean;
}

export interface IngressSettings {
  class?: string;
  disable?: boolean;
}

export interface GatewaySettings {
  limit?: number;
}

export interface GatewayAPISettings {
  class?: string;
  disable?: boolean;
  defaultGateway?: ObjectReference;
  gatewaySettings?: GatewaySettings;
  disableHTTPRoute?: boolean;
  disableGRPCRoute?: boolean;
  disableTCPRoute?: boolean;
  disableUDPRoute?: boolean;
  disableTLSRoute?: boolean;
  disableBackendTrafficPolicy?: boolean;
  disableClientTrafficPolicy?: boolean;
}

export interface DNSSettings {
  disable?: boolean;
  wildcardDomain?: string;
  allowedDomains?: string[];
  allowExplicitHostnames?: boolean;
  useDNSAnnotations?: boolean;
  useCertificateAnnotations?: boolean;
}

export interface CertificatesSettings {
  disable?: boolean;
  defaultClusterIssuer?: string;
  allowedDomains?: string[];
}

export interface TenantSpec {
  propagatedAnnotations?: Record<string, string>;
  propagateAllAnnotations?: boolean;
  defaultAnnotations?: Record<string, Record<string, string>>;
  loadBalancer?: LoadBalancerSettings;
  ingress?: IngressSettings;
  gatewayAPI?: GatewayAPISettings;
  dns?: DNSSettings;
  certificates?: CertificatesSettings;
  tunnel?: TenantTunnelSettings;
  circuitBreaker?: CircuitBreaker;
  networkPolicy?: NetworkPolicySettings;
  loadBalancerPolicy?: LoadBalancerPolicy;
  allowedDomains?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TenantStatus {}

export interface Tenant {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  spec: TenantSpec;
  status?: TenantStatus;
}

// SyncSecret

export interface SyncSecret {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  immutable?: boolean;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
  type?: string;
}

// Config

export interface EnvoyProxyGracefulShutdown {
  disabled?: boolean;
  drainTimeout?: string;
  minDrainDuration?: string;
  terminationGracePeriodSeconds?: number;
  shutdownManagerImage?: string;
}

export interface EnvoyProxyOverloadManager {
  enabled?: boolean;
  maxActiveDownstreamConnections?: number;
  maxHeapSizeBytes?: number;
}

export interface EnvoyProxy {
  topology?: "shared" | "dedicated" | "global";
  useDaemonset?: boolean;
  replicas?: number;
  singlePodPerNode?: boolean;
  nodeSelector?: Record<string, string>;
  tolerations?: Array<Record<string, unknown>>;
  resources?: Record<string, unknown>;
  affinity?: Record<string, unknown>;
  image?: string;
  gracefulShutdown?: EnvoyProxyGracefulShutdown;
  overloadManager?: EnvoyProxyOverloadManager;
  podMonitor?: { enabled?: boolean };
}

export interface ConfigDNSSettings {
  wildcardDomain?: string;
  allowExplicitHostnames?: boolean;
  useDNSAnnotations?: boolean;
  useCertificateAnnotations?: boolean;
}

export interface ConfigCertificatesSettings {
  defaultClusterIssuer?: string;
}

export interface ConfigSpec {
  propagatedAnnotations?: Record<string, string>;
  propagateAllAnnotations?: boolean;
  defaultAnnotations?: Record<string, Record<string, string>>;
  envoyProxy?: EnvoyProxy;
  loadBalancer?: LoadBalancerSettings;
  ingress?: IngressSettings;
  gatewayAPI?: GatewayAPISettings;
  dns?: ConfigDNSSettings;
  certificates?: ConfigCertificatesSettings;
  tunnel?: TunnelSettings;
  circuitBreaker?: CircuitBreaker;
  loadBalancerPolicy?: LoadBalancerPolicy;
  waf?: WAFSettings;
  networkPolicy?: NetworkPolicySettings;
}

export interface Config {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  spec: ConfigSpec;
}

export interface TenantTunnelSettings {
  limit?: number;
  disable?: boolean;
}

export interface TunnelSettings {
  limit?: number;
  connectionManagerURL?: string;
  disable?: boolean;
}

export interface PerEndpointCircuitBreaker {
  maxConnections?: number;
}

export interface CircuitBreaker {
  maxConnections?: number;
  maxPendingRequests?: number;
  maxParallelRequests?: number;
  maxParallelRetries?: number;
  maxRequestsPerConnection?: number;
  perEndpoint?: PerEndpointCircuitBreaker;
}

export interface NamedNetworkPolicy {
  name: string;
  spec: Record<string, unknown>;
}

export interface NetworkPolicySettings {
  enable?: boolean;
  disabledPolicies?: string[];
  additionalPolicies?: NamedNetworkPolicy[];
}

export type LoadBalancerPolicy = "RoundRobin" | "LeastRequest" | "Random";

export type WAFFailureMode = "Open" | "Closed";

export interface WAFTargetRef {
  group?: string;
  kind: string;
  namespace?: string;
  name: string;
}

export interface WAFPolicySpec {
  global?: boolean;
  targetRef?: WAFTargetRef;
  targetSelector?: Record<string, unknown>;
  directives?: string[];
  failureMode?: WAFFailureMode;
}

export interface WAFPolicyStatus {
  conditions?: Condition[];
}

export interface WAFPolicy {
  apiVersion: string;
  kind: string;
  metadata: ObjectMeta;
  spec: WAFPolicySpec;
  status?: WAFPolicyStatus;
}

export interface WAFSettings {
  wasmInitContainerImage?: string;
  skipValidation?: boolean;
}
