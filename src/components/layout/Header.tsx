import React, { useState } from 'react';
import { 
  Cloud, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Bell, 
  Menu, 
  RefreshCw,
  Flame,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  Server
} from 'lucide-react';
import { useSystemStore } from '../../store/useSystemStore';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
  const metrics = useSystemStore((state) => state.metrics);
  const backendConnected = useSystemStore((state) => state.backendConnected);
  const tickSimulation = useSystemStore((state) => state.tickSimulation);
  const events = useSystemStore((state) => state.events);
  const environment = useSystemStore((state) => state.environment);
  const setEnvironment = useSystemStore((state) => state.setEnvironment);
  const region = useSystemStore((state) => state.region);
  const setRegion = useSystemStore((state) => state.setRegion);
  const loadTest = useSystemStore((state) => state.loadTest);
  const startLoadTest = useSystemStore((state) => state.startLoadTest);
  const stopLoadTest = useSystemStore((state) => state.stopLoadTest);
  const simulationSpeed = useSystemStore((state) => state.simulationSpeed);
  const setSimulationSpeed = useSystemStore((state) => state.setSimulationSpeed);
  const clearEvents = useSystemStore((state) => state.clearEvents);
  const isSidebarCollapsed = useSystemStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useSystemStore((state) => state.toggleSidebar);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await tickSimulation();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const toggleQuickLoad = () => {
    if (loadTest.isActive) {
      stopLoadTest();
    } else {
      startLoadTest('high', 165);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-11 bg-black border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between select-none">
        {/* Left: Mobile Toggle / Desktop Collapse Toggle & Brand Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={onMobileMenuToggle}
            className="p-1 -ml-1 rounded text-neutral-400 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop Sidebar slide toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center p-1 -ml-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
            title={isSidebarCollapsed ? "Slide to expand sidebar (Ctrl+B)" : "Slide to collapse sidebar (Ctrl+B)"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-neutral-300 hover:text-white" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-neutral-300 hover:text-white" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-xs font-bold tracking-wider text-white">eXpan</span>
              <span className="hidden sm:inline text-[10px] text-neutral-400">/ Cloud Auto-Scaling</span>
            </div>
          </div>
        </div>

        {/* Center: Live Scaling Status Pill */}
        <div className="hidden md:flex items-center gap-2">
          {metrics.scalingState === 'stable' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-medium border border-neutral-800 text-neutral-300 bg-neutral-950">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              STABLE • {metrics.activeInstances} ACTIVE EC2 NODES
            </span>
          )}
          {metrics.scalingState === 'scaling-up' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-black border border-white">
              <ArrowUpRight className="w-3.5 h-3.5 text-black" />
              SCALING UP (+1 INSTANCE)
            </span>
          )}
          {metrics.scalingState === 'scaling-down' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border border-white text-white bg-neutral-900">
              <ArrowDownRight className="w-3.5 h-3.5 text-white" />
              SCALING IN (DRAINING)
            </span>
          )}
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2">
          {/* Real Load Test Generator Trigger Button */}
          <button
            onClick={toggleQuickLoad}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all border ${
              loadTest.isActive
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border-neutral-800'
            }`}
            title="Toggle active HTTP traffic generator"
          >
            <Flame className="w-3 h-3" />
            <span>{loadTest.isActive ? 'STOP LOAD TEST' : 'START LOAD TEST'}</span>
          </button>

          {/* Environment & Region Selector */}
          <div className="hidden lg:flex items-center bg-neutral-900 border border-neutral-800 rounded px-2 py-0.5 text-[10px] font-mono text-neutral-300">
            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="bg-transparent text-white outline-none cursor-pointer pr-1 uppercase font-semibold"
              aria-label="Select environment"
            >
              <option value="production" className="bg-black text-white">PROD</option>
              <option value="staging" className="bg-black text-white">STAG</option>
              <option value="development" className="bg-black text-white">DEV</option>
            </select>
            <span className="text-neutral-600 mx-1">/</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-transparent text-neutral-400 outline-none cursor-pointer"
              aria-label="Select region"
            >
              <option value="ap-south-1" className="bg-black text-white">ap-south-1</option>
              <option value="us-east-1" className="bg-black text-white">us-east-1</option>
              <option value="eu-west-1" className="bg-black text-white">eu-west-1</option>
            </select>
          </div>

          {/* Polling Speed Multiplier */}
          <div className="hidden sm:flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5 text-[10px] font-mono">
            {(['1x', '2x', '4x'] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-all font-bold ${
                  simulationSpeed === spd
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title={`Telemetry Polling Rate ${spd}`}
              >
                {spd}
              </button>
            ))}
          </div>

          {/* Real Backend Engine Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
              backendConnected
                ? 'bg-neutral-900 text-white border-neutral-700'
                : 'bg-black text-neutral-400 border-neutral-800'
            }`}
            title={backendConnected ? 'Connected to live cloud backend engine' : 'Disconnected from backend'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-white' : 'bg-neutral-600'}`} />
            <span>{backendConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>

          {/* Manual Poll */}
          <button
            onClick={handleManualRefresh}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors border border-transparent hover:border-neutral-800"
            title="Poll metrics"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors relative border border-transparent hover:border-neutral-800"
            title="View alerts"
            aria-label="View notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {events.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </button>

          {/* Profile / System Info */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center pl-1.5 border-l border-neutral-800"
            title="Cluster Operations Info"
          >
            <div className="w-5 h-5 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[9px] font-mono font-bold text-white">
              OPS
            </div>
          </button>
        </div>
      </header>

      {/* Notifications Modal */}
      <Modal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Scaling Audit Log & CloudWatch Alerts"
      >
        <div className="space-y-3 font-mono">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-850 text-xs text-neutral-400">
            <span>{events.length} Total Logged Events</span>
            {events.length > 0 && (
              <button
                onClick={clearEvents}
                className="text-[10px] text-neutral-400 hover:text-white underline font-mono"
              >
                Clear All Alerts
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-6">No active notifications or alerts.</p>
            ) : (
              events.slice(0, 10).map((evt) => (
                <div key={evt.id} className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-white font-bold uppercase text-[10px]">
                      {evt.type}
                    </span>
                    <span className="text-neutral-400 text-[10px]">{evt.timestamp}</span>
                  </div>
                  <p className="text-neutral-300 text-xs font-sans">{evt.reason}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Cluster & Infrastructure Info Modal */}
      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="eXpan — Cloud Infrastructure Operations Platform"
      >
        <div className="space-y-3 text-xs text-neutral-300 font-sans">
          <p className="leading-relaxed">
            <strong className="text-white font-mono">SYSTEM:</strong> eXpan — Production Cloud Auto-Scaling Platform
          </p>
          <p className="leading-relaxed">
            <strong className="text-white font-mono">TOPOLOGY:</strong> HTTP Ingress Clients &rarr; Application Load Balancer (Least Connections / RR) &rarr; Multi-AZ Worker Fleet &rarr; CloudWatch Metric Evaluators &rarr; Auto Scaling Group (Target Tracking).
          </p>
          <div className="p-3 rounded bg-neutral-950 border border-neutral-800 space-y-1 font-mono text-[11px] text-neutral-300">
            <div>• Target Scale-Out: Average CPU &gt; {useSystemStore.getState().asgConfig.scaleOutThreshold}%</div>
            <div>• Target Scale-In: Average CPU &lt; {useSystemStore.getState().asgConfig.scaleInThreshold}%</div>
            <div>• Capacity Bounds: Min {useSystemStore.getState().asgConfig.minInstances}, Max {useSystemStore.getState().asgConfig.maxInstances} Nodes</div>
            <div>• VPC Deployment: {region} (Multi-AZ)</div>
            <div>• Backend Engine: High-Performance Node.js Cluster with Real HTTP Reverse Proxy</div>
          </div>
          <div className="pt-2 flex justify-end">
            <Button size="sm" variant="secondary" onClick={() => setIsProfileOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
