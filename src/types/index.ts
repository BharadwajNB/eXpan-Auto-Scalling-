export type InstanceStatus = 'healthy' | 'unhealthy' | 'launching' | 'terminating';

export interface Instance {
  id: string;
  name: string;
  status: InstanceStatus;
  cpu: number; // percentage 0-100
  memory: number; // percentage 0-100
  requestsPerSecond: number;
  uptime: string;
  availabilityZone: string;
  privateIp: string;
  publicIp: string;
  instanceType: string;
  launchTime: string;
  networkInMb: number;
  networkOutMb: number;
  healthCheckPasses: number;
}

export type ScalingEventType = 
  | 'scale-out' 
  | 'scale-in' 
  | 'alert' 
  | 'instance-started' 
  | 'instance-terminated' 
  | 'instance-unhealthy'
  | 'instance-replaced'
  | 'health-check';

export type ScalingEventStatus = 'completed' | 'pending' | 'failed';

export interface ScalingEvent {
  id: string;
  timestamp: string;
  type: ScalingEventType;
  instanceId?: string;
  reason: string;
  status: ScalingEventStatus;
  details?: string;
}

export type ScalingState = 'stable' | 'scaling-up' | 'scaling-down';

export interface SystemMetrics {
  cpuUtilization: number;
  memoryUtilization: number;
  requestsPerSecond: number;
  latency: number; // in milliseconds
  errorRate: number; // percentage 0-100
  activeInstances: number;
  healthyInstances: number;
  unhealthyInstances: number;
  loadBalancerHealth: number; // percentage 0-100
  scalingState: ScalingState;
  estimatedCostPerHour: number; // USD
}

export interface MetricDataPoint {
  timestamp: number;
  timeLabel: string;
  cpu: number;
  memory: number;
  requests: number;
  latency: number;
  instances: number;
  networkIn: number;
  networkOut: number;
  errorRate: number;
}

export type ScalingMetricType = 'cpu' | 'rps' | 'memory';

export interface AutoScalingConfig {
  minInstances: number;
  maxInstances: number;
  desiredInstances: number;
  scaleOutThreshold: number; // percentage e.g. 70
  scaleInThreshold: number; // percentage e.g. 30
  cooldownSeconds: number;
  activeCooldown: number; // remaining seconds
  policyType: 'Target Tracking' | 'Step Scaling' | 'Simple Scaling';
  evaluationPeriod: string;
  metricType: ScalingMetricType;
  breachChecks: number;
}

export type LoadPreset = 'normal' | 'medium' | 'high' | 'extreme';
export type TrafficPattern = 'constant' | 'spike' | 'staircase' | 'sine';
export type SimulationSpeed = '1x' | '2x' | '4x';

export interface LoadTestConfig {
  isActive: boolean;
  preset: LoadPreset;
  pattern: TrafficPattern;
  targetRps: number;
  concurrentUsers: number;
  currentRps: number;
  durationSeconds: number;
  elapsedSeconds: number;
  errorInjectionRate: number;
  durationLimit: number; // 0 = continuous
}

export interface TargetGroupTarget {
  id: string;
  instanceId: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'draining' | 'initial';
  healthCheckPath: string;
  healthCheckLatencyMs: number;
  az: string;
  trafficPercentage: number;
}

export interface LoadBalancerInfo {
  name: string;
  dnsName: string;
  scheme: 'internet-facing' | 'internal';
  type: 'application';
  state: 'active' | 'provisioning' | 'failed';
  ipAddressType: 'ipv4';
  activeConnections: number;
  processedBytesMb: number;
  healthyTargets: number;
  totalTargets: number;
  algorithm: 'Round Robin' | 'Least Outstanding Requests';
  stickinessEnabled: boolean;
  stickinessDurationSeconds: number;
  deregistrationDelay: number;
  healthCheckPath: string;
}
