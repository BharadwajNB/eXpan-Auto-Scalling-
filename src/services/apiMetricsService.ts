import { Instance, ScalingEvent, SystemMetrics, MetricDataPoint, AutoScalingConfig, LoadBalancerInfo, LoadTestConfig } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiMetricsService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    const res = await fetch(`${this.baseUrl}/metrics/system`);
    if (!res.ok) throw new Error(`Failed to fetch system metrics: ${res.statusText}`);
    return res.json();
  }

  async getInstances(): Promise<Instance[]> {
    const res = await fetch(`${this.baseUrl}/instances`);
    if (!res.ok) throw new Error(`Failed to fetch instances: ${res.statusText}`);
    return res.json();
  }

  async getInstanceLogs(id: string): Promise<{ instanceId: string; name: string; logs: string[] }> {
    const res = await fetch(`${this.baseUrl}/instances/${id}/logs`);
    if (!res.ok) throw new Error(`Failed to fetch logs for ${id}: ${res.statusText}`);
    return res.json();
  }

  async provisionInstance(): Promise<{ success: boolean; instance: any }> {
    const res = await fetch(`${this.baseUrl}/instances`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Failed to provision instance`);
    }
    return res.json();
  }

  async terminateInstance(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/instances/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Failed to terminate instance`);
    }
    return res.json();
  }

  async rebootInstance(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/instances/${id}/reboot`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to reboot instance: ${res.statusText}`);
    return res.json();
  }

  async crashInstance(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/instances/${id}/crash`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to crash instance: ${res.statusText}`);
    return res.json();
  }

  async stressInstance(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${this.baseUrl}/instances/${id}/stress`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to stress instance: ${res.statusText}`);
    return res.json();
  }

  async getScalingEvents(): Promise<ScalingEvent[]> {
    const res = await fetch(`${this.baseUrl}/events`);
    if (!res.ok) throw new Error(`Failed to fetch events: ${res.statusText}`);
    return res.json();
  }

  async clearEvents(): Promise<{ success: boolean }> {
    const res = await fetch(`${this.baseUrl}/events`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to clear events: ${res.statusText}`);
    return res.json();
  }

  async getHistoricalMetrics(): Promise<MetricDataPoint[]> {
    const res = await fetch(`${this.baseUrl}/metrics/history`);
    if (!res.ok) throw new Error(`Failed to fetch metric history: ${res.statusText}`);
    return res.json();
  }

  async getAutoScalingConfig(): Promise<AutoScalingConfig> {
    const res = await fetch(`${this.baseUrl}/autoscaling/config`);
    if (!res.ok) throw new Error(`Failed to fetch ASG config: ${res.statusText}`);
    return res.json();
  }

  async updateAutoScalingConfig(config: Partial<AutoScalingConfig>): Promise<AutoScalingConfig> {
    const res = await fetch(`${this.baseUrl}/autoscaling/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(`Failed to update ASG config: ${res.statusText}`);
    return res.json();
  }

  async bypassCooldown(): Promise<{ success: boolean }> {
    const res = await fetch(`${this.baseUrl}/autoscaling/cooldown/bypass`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to bypass cooldown: ${res.statusText}`);
    return res.json();
  }

  async getLoadBalancerInfo(): Promise<LoadBalancerInfo> {
    const res = await fetch(`${this.baseUrl}/loadbalancer/info`);
    if (!res.ok) throw new Error(`Failed to fetch ALB info: ${res.statusText}`);
    return res.json();
  }

  async updateLoadBalancerConfig(config: Partial<LoadBalancerInfo>): Promise<LoadBalancerInfo> {
    const res = await fetch(`${this.baseUrl}/loadbalancer/config`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(`Failed to update ALB config: ${res.statusText}`);
    return res.json();
  }

  async sendProbe(path = '/health'): Promise<{ success: boolean; results: any[] }> {
    const res = await fetch(`${this.baseUrl}/loadbalancer/probe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    });
    if (!res.ok) throw new Error(`Failed to send probe: ${res.statusText}`);
    return res.json();
  }

  async getLoadTestStatus(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/loadtest/status`);
    if (!res.ok) throw new Error(`Failed to fetch load test status: ${res.statusText}`);
    return res.json();
  }

  async startLoadTest(preset = 'normal', targetRps = 32, pattern = 'constant'): Promise<any> {
    const res = await fetch(`${this.baseUrl}/loadtest/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset, targetRps, pattern }),
    });
    if (!res.ok) throw new Error(`Failed to start load test: ${res.statusText}`);
    return res.json();
  }

  async stopLoadTest(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/loadtest/stop`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to stop load test: ${res.statusText}`);
    return res.json();
  }

  async testConnection(url?: string): Promise<{ success: boolean; status?: number; latencyMs?: number; message: string }> {
    const res = await fetch(`${this.baseUrl}/settings/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return res.json();
  }
}

export const apiMetricsService = new ApiMetricsService();
