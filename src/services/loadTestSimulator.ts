import { LoadPreset } from '../types';

export interface PresetProfile {
  targetRps: number;
  concurrentUsers: number;
  baseCpuPerInstanceRps: number; // CPU per 10 req/s on 1 instance
  targetInstances: number;
  label: string;
  description: string;
}

export const PRESET_PROFILES: Record<LoadPreset, PresetProfile> = {
  normal: {
    targetRps: 32,
    concurrentUsers: 45,
    baseCpuPerInstanceRps: 7.0, // 3.2 * 7 = ~22.4% CPU on 1 instance
    targetInstances: 1,
    label: 'Normal Traffic',
    description: 'Baseline production traffic (30-40 req/s, 1 instance, ~24% CPU)',
  },
  medium: {
    targetRps: 85,
    concurrentUsers: 160,
    baseCpuPerInstanceRps: 6.0, // 8.5 * 6 = ~51% CPU on 1 instance
    targetInstances: 1,
    label: 'Medium Load',
    description: 'Elevated shopping/API traffic (80-90 req/s, ~50% CPU)',
  },
  high: {
    targetRps: 165,
    concurrentUsers: 340,
    baseCpuPerInstanceRps: 5.5, // 16.5 * 5.5 = ~90% on 1 instance, triggers scale-out to 2 instances -> ~45% CPU
    targetInstances: 2,
    label: 'High Surge',
    description: 'Flash-sale or marketing surge (150-180 req/s, triggers Scale-Out to 2 instances)',
  },
  extreme: {
    targetRps: 285,
    concurrentUsers: 620,
    baseCpuPerInstanceRps: 5.2, // Breaches 70% even with 2 instances, scaling to 3 or 4 instances
    targetInstances: 3,
    label: 'Extreme Spike',
    description: 'DDoS simulation or viral product launch (280+ req/s, scales up to 3-4 instances)',
  },
};

/**
 * Calculates theoretical CPU based on incoming RPS and number of healthy active instances
 */
export function calculateInstanceCpu(rps: number, activeInstances: number): number {
  if (activeInstances <= 0) return 0;
  // RPS per instance
  const rpsPerInstance = rps / activeInstances;
  // Base OS idle overhead ~10% + load factor
  const calculated = 10 + rpsPerInstance * 4.2;
  // add small natural noise
  const noise = (Math.random() - 0.5) * 3;
  return Math.min(98, Math.max(12, +(calculated + noise).toFixed(1)));
}

/**
 * Calculates API response latency based on CPU load and RPS
 */
export function calculateLatency(cpu: number, rps: number): number {
  // Base healthy latency: 90-120ms
  // If CPU > 75%, queue length builds and latency rises to 200-380ms
  let base = 95 + (rps * 0.15);
  if (cpu > 70) {
    const overloadFactor = Math.pow((cpu - 70) / 10, 1.8) * 45;
    base += overloadFactor;
  }
  const noise = (Math.random() - 0.5) * 8;
  return Math.max(80, Math.round(base + noise));
}

/**
 * Calculates error rate (HTTP 5xx / timeouts) based on CPU saturation
 */
export function calculateErrorRate(cpu: number): number {
  if (cpu < 75) {
    return +(0.02 + Math.random() * 0.05).toFixed(2); // Healthy 0.02 - 0.07%
  }
  // Above 75% error rate starts climbing up to 1-4%
  const factor = (cpu - 75) * 0.18;
  return +(factor + Math.random() * 0.2).toFixed(2);
}
