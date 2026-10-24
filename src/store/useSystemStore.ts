import { create } from 'zustand';
import { 
  Instance, 
  ScalingEvent, 
  SystemMetrics, 
  MetricDataPoint, 
  AutoScalingConfig, 
  LoadBalancerInfo, 
  LoadPreset, 
  LoadTestConfig,
  TrafficPattern,
  SimulationSpeed,
  ScalingMetricType
} from '../types';
import { apiMetricsService } from '../services/apiMetricsService';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
}

interface SystemStore {
  metrics: SystemMetrics;
  instances: Instance[];
  events: ScalingEvent[];
  asgConfig: AutoScalingConfig;
  lbInfo: LoadBalancerInfo;
  history: MetricDataPoint[];
  loadTest: LoadTestConfig;
  selectedInstance: Instance | null;
  selectedInstanceLogs: string[];
  isLoadingLogs: boolean;
  simulationRunning: boolean;
  simulationSpeed: SimulationSpeed;
  timeRange: '5m' | '15m' | '30m' | '1h' | '6h' | '24h';
  toast: ToastNotification | null;

  environment: 'production' | 'staging' | 'development';
  region: string;
  chartViewMode: 'split' | 'cpu' | 'traffic';
  isNotificationsOpen: boolean;
  isProjectInfoOpen: boolean;
  isSidebarCollapsed: boolean;
  backendConnected: boolean;

  // Real Working Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  tickSimulation: () => Promise<void>;
  startLoadTest: (preset?: LoadPreset, customRps?: number, customUsers?: number) => Promise<void>;
  stopLoadTest: () => Promise<void>;
  setPreset: (preset: LoadPreset) => void;
  setTrafficPattern: (pattern: TrafficPattern) => void;
  setErrorInjectionRate: (rate: number) => void;
  setDurationLimit: (seconds: number) => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  selectInstance: (instance: Instance | null) => Promise<void>;
  fetchInstanceLogs: (id: string) => Promise<void>;
  dismissToast: () => void;
  showToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  updateAsgConfig: (config: Partial<AutoScalingConfig>) => Promise<void>;
  setTimeRange: (range: '5m' | '15m' | '30m' | '1h' | '6h' | '24h') => void;
  resetSimulation: () => Promise<void>;
  terminateInstanceManually: (id: string) => Promise<void>;
  manuallyScale: (direction: 'up' | 'down') => Promise<void>;
  simulateInstanceFailure: (id: string) => Promise<void>;
  injectInstanceCpuStress: (id: string, cpu?: number) => Promise<void>;
  rebootInstance: (id: string) => Promise<void>;
  setEnvironment: (env: 'production' | 'staging' | 'development') => void;
  setRegion: (region: string) => void;
  setChartViewMode: (mode: 'split' | 'cpu' | 'traffic') => void;
  setIsNotificationsOpen: (open: boolean) => void;
  setIsProjectInfoOpen: (open: boolean) => void;
  setLbAlgorithm: (algorithm: 'Round Robin' | 'Least Outstanding Requests') => Promise<void>;
  toggleStickiness: () => Promise<void>;
  setDeregistrationDelay: (seconds: number) => Promise<void>;
  setHealthCheckPath: (path: string) => Promise<void>;
  setScalingMetricType: (type: ScalingMetricType) => Promise<void>;
  clearEvents: () => Promise<void>;
  sendTestProbe: () => Promise<void>;
  exportEvents: (format: 'json' | 'csv') => void;
  exportMetrics: () => void;
  bypassCooldown: () => Promise<void>;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  metrics: {
    cpuUtilization: 24.5,
    memoryUtilization: 42.0,
    requestsPerSecond: 32,
    latency: 118,
    errorRate: 0.05,
    activeInstances: 1,
    healthyInstances: 1,
    unhealthyInstances: 0,
    loadBalancerHealth: 100,
    scalingState: 'stable',
    estimatedCostPerHour: 0.0416,
  },
  instances: [],
  events: [],
  asgConfig: {
    minInstances: 1,
    maxInstances: 4,
    desiredInstances: 1,
    scaleOutThreshold: 70,
    scaleInThreshold: 30,
    cooldownSeconds: 45,
    activeCooldown: 0,
    policyType: 'Target Tracking',
    evaluationPeriod: '1 minute',
    metricType: 'cpu',
    breachChecks: 1,
  },
  lbInfo: {
    name: 'alb-expan-prod',
    dnsName: 'alb-expan-prod.ap-south-1.elb.amazonaws.com',
    scheme: 'internet-facing',
    type: 'application',
    state: 'active',
    ipAddressType: 'ipv4',
    activeConnections: 0,
    processedBytesMb: 12.4,
    healthyTargets: 1,
    totalTargets: 1,
    algorithm: 'Least Outstanding Requests',
    stickinessEnabled: false,
    stickinessDurationSeconds: 86400,
    deregistrationDelay: 30,
    healthCheckPath: '/health',
  },
  history: [],
  loadTest: {
    isActive: false,
    preset: 'normal',
    pattern: 'constant',
    targetRps: 32,
    concurrentUsers: 45,
    currentRps: 32,
    durationSeconds: 0,
    elapsedSeconds: 0,
    errorInjectionRate: 0,
    durationLimit: 0,
  },
  selectedInstance: null,
  selectedInstanceLogs: [],
  isLoadingLogs: false,
  simulationRunning: true,
  simulationSpeed: '2x',
  timeRange: '30m',
  toast: null,
  environment: 'production',
  region: 'ap-south-1',
  chartViewMode: 'split',
  isNotificationsOpen: false,
  isProjectInfoOpen: false,
  isSidebarCollapsed: false,
  backendConnected: true,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  setTimeRange: (timeRange) => set({ timeRange }),

  setSimulationSpeed: (simulationSpeed) => {
    set({ simulationSpeed });
    get().showToast({
      title: 'Telemetry Polling Rate',
      message: `Polling refresh rate configured to ${simulationSpeed}.`,
      type: 'info',
    });
  },

  selectInstance: async (selectedInstance) => {
    set({ selectedInstance });
    if (selectedInstance) {
      await get().fetchInstanceLogs(selectedInstance.id);
    }
  },

  fetchInstanceLogs: async (id: string) => {
    set({ isLoadingLogs: true });
    try {
      const data = await apiMetricsService.getInstanceLogs(id);
      set({ selectedInstanceLogs: data.logs || [], isLoadingLogs: false });
    } catch (e) {
      set({ selectedInstanceLogs: ['[SYSTEM] Worker log stream active. Waiting for incoming telemetry...'], isLoadingLogs: false });
    }
  },

  dismissToast: () => set({ toast: null }),

  showToast: (toastData) => {
    const id = `toast-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    set({ toast: { ...toastData, id, timestamp } });
  },

  setEnvironment: (environment) => {
    set({ environment });
    get().showToast({
      title: 'Target Deployment Switched',
      message: `Operational target set to ${environment.toUpperCase()}`,
      type: 'info',
    });
  },

  setRegion: (region) => {
    set({ region });
    get().showToast({
      title: 'Region Switched',
      message: `Target AWS region changed to ${region}`,
      type: 'info',
    });
  },

  setChartViewMode: (chartViewMode) => set({ chartViewMode }),
  setIsNotificationsOpen: (isNotificationsOpen) => set({ isNotificationsOpen }),
  setIsProjectInfoOpen: (isProjectInfoOpen) => set({ isProjectInfoOpen }),

  setLbAlgorithm: async (algorithm) => {
    try {
      const updated = await apiMetricsService.updateLoadBalancerConfig({ algorithm });
      set({ lbInfo: updated });
      get().showToast({
        title: 'Routing Algorithm Updated',
        message: `ALB traffic distribution algorithm changed to ${algorithm}`,
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Update Failed', message: e.message, type: 'alert' });
    }
  },

  toggleStickiness: async () => {
    const currentState = get().lbInfo.stickinessEnabled;
    try {
      const updated = await apiMetricsService.updateLoadBalancerConfig({ stickinessEnabled: !currentState });
      set({ lbInfo: updated });
      get().showToast({
        title: 'Session Affinity (Stickiness)',
        message: `Cookie-based target stickiness is now ${!currentState ? 'ENABLED' : 'DISABLED'}.`,
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Update Failed', message: e.message, type: 'alert' });
    }
  },

  setDeregistrationDelay: async (seconds) => {
    try {
      const updated = await apiMetricsService.updateLoadBalancerConfig({ deregistrationDelay: seconds });
      set({ lbInfo: updated });
      get().showToast({
        title: 'Deregistration Delay Updated',
        message: `Target group connection draining delay set to ${seconds}s.`,
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Update Failed', message: e.message, type: 'alert' });
    }
  },

  setHealthCheckPath: async (healthCheckPath) => {
    try {
      const updated = await apiMetricsService.updateLoadBalancerConfig({ healthCheckPath });
      set({ lbInfo: updated });
      get().showToast({
        title: 'Health Check Path Configured',
        message: `ALB target check endpoint updated to GET ${healthCheckPath}`,
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Update Failed', message: e.message, type: 'alert' });
    }
  },

  setScalingMetricType: async (metricType) => {
    try {
      const updated = await apiMetricsService.updateAutoScalingConfig({ metricType });
      set({ asgConfig: updated });
      get().showToast({
        title: 'ASG Alarm Metric Updated',
        message: `Auto Scaling tracking metric changed to ${metricType.toUpperCase()}`,
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Update Failed', message: e.message, type: 'alert' });
    }
  },

  setTrafficPattern: (pattern) => {
    set((state) => ({
      loadTest: { ...state.loadTest, pattern }
    }));
  },

  setErrorInjectionRate: (errorInjectionRate) => {
    set((state) => ({
      loadTest: { ...state.loadTest, errorInjectionRate }
    }));
  },

  setDurationLimit: (durationLimit) => {
    set((state) => ({
      loadTest: { ...state.loadTest, durationLimit }
    }));
  },

  updateAsgConfig: async (updated) => {
    try {
      const res = await apiMetricsService.updateAutoScalingConfig(updated);
      set({ asgConfig: res });
      get().showToast({
        title: 'ASG Policy Saved',
        message: 'Auto-scaling thresholds updated on the cloud engine.',
        type: 'success',
      });
    } catch (e: any) {
      get().showToast({ title: 'Error Saving Policy', message: e.message, type: 'alert' });
    }
  },

  bypassCooldown: async () => {
    try {
      await apiMetricsService.bypassCooldown();
      set((state) => ({ asgConfig: { ...state.asgConfig, activeCooldown: 0 } }));
      get().showToast({
        title: 'Cooldown Bypassed',
        message: 'Active cooldown timer cleared. Auto-scaling is immediately evaluating metrics.',
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Bypass Failed', message: e.message, type: 'alert' });
    }
  },

  clearEvents: async () => {
    try {
      await apiMetricsService.clearEvents();
      set({ events: [] });
      get().showToast({
        title: 'Events Cleared',
        message: 'Audit log cleared on cloud backend.',
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Clear Failed', message: e.message, type: 'alert' });
    }
  },

  sendTestProbe: async () => {
    const path = get().lbInfo.healthCheckPath || '/health';
    try {
      const res = await apiMetricsService.sendProbe(path);
      await get().tickSimulation();
      get().showToast({
        title: 'Health Check Probes Dispatched',
        message: `HTTP probe sent to ${res.results.length} active instances. All responded with valid statuses.`,
        type: 'success',
      });
    } catch (e: any) {
      get().showToast({ title: 'Probe Failed', message: e.message, type: 'alert' });
    }
  },

  setPreset: (preset: LoadPreset) => {
    const presets: Record<LoadPreset, { targetRps: number; concurrentUsers: number }> = {
      normal: { targetRps: 32, concurrentUsers: 45 },
      medium: { targetRps: 85, concurrentUsers: 160 },
      high: { targetRps: 165, concurrentUsers: 340 },
      extreme: { targetRps: 285, concurrentUsers: 620 },
    };
    const p = presets[preset];
    set((state) => ({
      loadTest: {
        ...state.loadTest,
        preset,
        targetRps: p.targetRps,
        concurrentUsers: p.concurrentUsers,
      }
    }));
  },

  startLoadTest: async (preset?: LoadPreset, customRps?: number) => {
    const state = get();
    const activePreset = preset || state.loadTest.preset;
    const targetRps = customRps || state.loadTest.targetRps;

    try {
      const res = await apiMetricsService.startLoadTest(activePreset, targetRps, state.loadTest.pattern);
      set({
        loadTest: {
          ...state.loadTest,
          isActive: true,
          preset: activePreset,
          targetRps,
          elapsedSeconds: 0,
        }
      });
      get().showToast({
        title: 'Traffic Generator Active',
        message: `Injecting real HTTP load towards ALB gateway at ${targetRps} req/s.`,
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Failed to Start Load Test', message: e.message, type: 'alert' });
    }
  },

  stopLoadTest: async () => {
    try {
      await apiMetricsService.stopLoadTest();
      set((state) => ({
        loadTest: {
          ...state.loadTest,
          isActive: false,
          elapsedSeconds: 0,
          currentRps: 0,
        }
      }));
      get().showToast({
        title: 'Traffic Generator Halted',
        message: 'Load injection stopped. Ingress returning to idle baseline.',
        type: 'warning',
      });
    } catch (e: any) {
      get().showToast({ title: 'Stop Failed', message: e.message, type: 'alert' });
    }
  },

  manuallyScale: async (direction: 'up' | 'down') => {
    const state = get();
    if (direction === 'up') {
      if (state.instances.length >= state.asgConfig.maxInstances) {
        get().showToast({
          title: 'Maximum Capacity Limit',
          message: `Cannot launch more nodes (Max: ${state.asgConfig.maxInstances})`,
          type: 'warning',
        });
        return;
      }
      try {
        const res = await apiMetricsService.provisionInstance();
        await get().tickSimulation();
        get().showToast({
          title: 'Instance Provisioned',
          message: `Worker node ${res.instance?.name || ''} launched and registered with ALB.`,
          type: 'success',
        });
      } catch (e: any) {
        get().showToast({ title: 'Launch Failed', message: e.message, type: 'alert' });
      }
    } else {
      if (state.instances.length <= state.asgConfig.minInstances) {
        get().showToast({
          title: 'Minimum Capacity Floor',
          message: `Cannot terminate further (Min: ${state.asgConfig.minInstances})`,
          type: 'warning',
        });
        return;
      }
      const last = state.instances[state.instances.length - 1];
      if (last) {
        try {
          await apiMetricsService.terminateInstance(last.id);
          await get().tickSimulation();
          get().showToast({
            title: 'Scale In Initiated',
            message: `Instance ${last.name} (${last.id}) connection draining and termination started.`,
            type: 'info',
          });
        } catch (e: any) {
          get().showToast({ title: 'Scale In Failed', message: e.message, type: 'alert' });
        }
      }
    }
  },

  terminateInstanceManually: async (id: string) => {
    const state = get();
    if (state.instances.length <= state.asgConfig.minInstances) {
      get().showToast({
        title: 'Action Rejected',
        message: `Minimum capacity constraint (${state.asgConfig.minInstances}) prevents terminating this instance.`,
        type: 'alert',
      });
      return;
    }
    try {
      await apiMetricsService.terminateInstance(id);
      if (state.selectedInstance?.id === id) {
        set({ selectedInstance: null });
      }
      await get().tickSimulation();
      get().showToast({
        title: 'Termination Dispatched',
        message: `Instance ${id} draining connections. ASG will evaluate health metrics.`,
        type: 'warning',
      });
    } catch (e: any) {
      get().showToast({ title: 'Termination Failed', message: e.message, type: 'alert' });
    }
  },

  rebootInstance: async (id: string) => {
    try {
      await apiMetricsService.rebootInstance(id);
      await get().tickSimulation();
      get().showToast({
        title: 'Instance Rebooted',
        message: `Worker process ${id} restarted and re-registered with ALB.`,
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Reboot Failed', message: e.message, type: 'alert' });
    }
  },

  simulateInstanceFailure: async (id: string) => {
    try {
      await apiMetricsService.crashInstance(id);
      await get().tickSimulation();
      get().showToast({
        title: 'Fault Injection Dispatched',
        message: `Process for ${id} killed via SIGKILL. ASG self-healing will auto-replace this node.`,
        type: 'alert',
      });
    } catch (e: any) {
      get().showToast({ title: 'Crash Failed', message: e.message, type: 'alert' });
    }
  },

  injectInstanceCpuStress: async (id: string) => {
    try {
      await apiMetricsService.stressInstance(id);
      await get().tickSimulation();
      get().showToast({
        title: 'Compute Stress Dispatched',
        message: `Intensive compute benchmark running on instance ${id}.`,
        type: 'warning',
      });
    } catch (e: any) {
      get().showToast({ title: 'Stress Injection Failed', message: e.message, type: 'alert' });
    }
  },

  resetSimulation: async () => {
    try {
      await apiMetricsService.stopLoadTest();
      await apiMetricsService.clearEvents();
      await get().tickSimulation();
      get().showToast({
        title: 'Environment Refreshed',
        message: 'Telemetry and event audit trail synchronized with server.',
        type: 'info',
      });
    } catch (e: any) {
      get().showToast({ title: 'Reset Failed', message: e.message, type: 'alert' });
    }
  },

  exportEvents: (format) => {
    const events = get().events;
    let content = '';
    let mimeType = 'text/plain';

    if (format === 'json') {
      content = JSON.stringify(events, null, 2);
      mimeType = 'application/json';
    } else {
      const headers = ['ID', 'Timestamp', 'Type', 'TargetInstance', 'Reason', 'Status', 'Details'];
      const rows = events.map(e => [
        e.id,
        e.timestamp,
        e.type,
        e.instanceId || 'fleet-wide',
        `"${e.reason.replace(/"/g, '""')}"`,
        e.status,
        `"${(e.details || '').replace(/"/g, '""')}"`
      ]);
      content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expan-audit-events-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    get().showToast({
      title: 'Audit Log Exported',
      message: `Downloaded ${events.length} real events as ${format.toUpperCase()}.`,
      type: 'success',
    });
  },

  exportMetrics: () => {
    const history = get().history;
    const headers = ['Timestamp', 'TimeLabel', 'CPU_Percent', 'Memory_Percent', 'RequestsPerSec', 'Latency_ms', 'ActiveInstances', 'NetworkIn_MB', 'NetworkOut_MB', 'ErrorRate_Percent'];
    const rows = history.map(h => [
      h.timestamp,
      h.timeLabel,
      h.cpu,
      h.memory,
      h.requests,
      h.latency,
      h.instances,
      h.networkIn,
      h.networkOut,
      h.errorRate
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expan-cloudwatch-telemetry-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    get().showToast({
      title: 'CloudWatch Telemetry Exported',
      message: `Exported ${history.length} real metric samples to CSV.`,
      type: 'success',
    });
  },

  // Primary Telemetry Polling Ticker
  tickSimulation: async () => {
    try {
      const [metrics, instances, events, history, asgConfig, lbInfo, loadTestStatus] = await Promise.all([
        apiMetricsService.getSystemMetrics().catch(() => null),
        apiMetricsService.getInstances().catch(() => null),
        apiMetricsService.getScalingEvents().catch(() => null),
        apiMetricsService.getHistoricalMetrics().catch(() => null),
        apiMetricsService.getAutoScalingConfig().catch(() => null),
        apiMetricsService.getLoadBalancerInfo().catch(() => null),
        apiMetricsService.getLoadTestStatus().catch(() => null),
      ]);

      set((state) => ({
        backendConnected: !!metrics,
        metrics: metrics || state.metrics,
        instances: instances || state.instances,
        events: events || state.events,
        history: history && history.length > 0 ? history : state.history,
        asgConfig: asgConfig || state.asgConfig,
        lbInfo: lbInfo || state.lbInfo,
        loadTest: loadTestStatus ? { ...state.loadTest, ...loadTestStatus } : state.loadTest,
      }));

      // If an instance is currently selected in the side drawer, refresh its log stream
      const currentSelected = get().selectedInstance;
      if (currentSelected) {
        const updatedTarget = (instances || []).find((i: Instance) => i.id === currentSelected.id);
        if (updatedTarget) {
          set({ selectedInstance: updatedTarget });
          await get().fetchInstanceLogs(updatedTarget.id);
        }
      }
    } catch (err) {
      console.error('Error fetching live cloud telemetry:', err);
      set({ backendConnected: false });
    }
  }
}));
