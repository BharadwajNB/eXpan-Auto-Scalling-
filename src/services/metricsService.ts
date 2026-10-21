import { Instance, ScalingEvent, SystemMetrics, MetricDataPoint, AutoScalingConfig, LoadBalancerInfo } from '../types';

export interface IMetricsService {
  getSystemMetrics(): Promise<SystemMetrics>;
  getInstances(): Promise<Instance[]>;
  getScalingEvents(): Promise<ScalingEvent[]>;
  getHistoricalMetrics(range: '5m' | '15m' | '30m' | '1h' | '6h' | '24h'): Promise<MetricDataPoint[]>;
  getAutoScalingConfig(): Promise<AutoScalingConfig>;
  getLoadBalancerInfo(): Promise<LoadBalancerInfo>;
  updateAutoScalingConfig(config: Partial<AutoScalingConfig>): Promise<AutoScalingConfig>;
}
