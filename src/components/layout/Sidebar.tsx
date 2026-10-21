import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  Network, 
  Layers, 
  Activity, 
  Gauge, 
  History, 
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useSystemStore } from '../../store/useSystemStore';

interface SidebarProps {
  onItemClick?: () => void;
  isMobileDrawer?: boolean;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/instances', label: 'Instances', icon: Server, badgeKey: 'activeInstances' },
  { path: '/load-balancer', label: 'Load Balancer', icon: Network },
  { path: '/auto-scaling', label: 'Auto Scaling', icon: Layers },
  { path: '/monitoring', label: 'Monitoring', icon: Activity },
  { path: '/load-testing', label: 'Load Testing', icon: Gauge, isAction: true },
  { path: '/events', label: 'Events Log', icon: History },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick, isMobileDrawer = false }) => {
  const metrics = useSystemStore((state) => state.metrics);
  const asgConfig = useSystemStore((state) => state.asgConfig);
  const loadTest = useSystemStore((state) => state.loadTest);
  const isSidebarCollapsed = useSystemStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useSystemStore((state) => state.toggleSidebar);

  const isCollapsed = !isMobileDrawer && isSidebarCollapsed;

  return (
    <aside 
      className={`h-[calc(100vh-2.75rem)] bg-black border-r border-neutral-800 flex flex-col justify-between shrink-0 select-none relative transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-14' : 'w-48'
      }`}
    >
      {/* Floating Edge Slide Collapse Handle on border */}
      {!isMobileDrawer && (
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? "Slide to expand sidebar (Ctrl+B)" : "Slide to collapse sidebar (Ctrl+B)"}
          aria-label={isCollapsed ? "Slide to expand sidebar" : "Slide to collapse sidebar"}
          className="absolute -right-3 top-9 z-40 flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 hover:border-neutral-500 shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-300" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5 text-neutral-300" />
          )}
        </button>
      )}

      {/* Navigation List */}
      <div className="p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {/* Header with Title & Slide Toggle */}
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-neutral-800/80 mb-1">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono">
              Infrastructure
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono text-neutral-500">Slide</span>
              {/* Sliding Toggle Pill */}
              <button
                type="button"
                role="switch"
                aria-checked={!isCollapsed}
                onClick={toggleSidebar}
                title="Slide to collapse sidebar (Ctrl+B)"
                className="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-neutral-700 bg-neutral-800 p-0.5 transition-colors duration-200 ease-in-out hover:border-neutral-500 focus:outline-none"
              >
                <span
                  className="pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out translate-x-3"
                />
              </button>
            </div>
          </div>
        ) : (
          /* Collapsed top: Slide expand trigger */
          <div className="flex flex-col items-center py-1 border-b border-neutral-800/80 mb-1">
            <button
              type="button"
              onClick={toggleSidebar}
              title="Slide to expand sidebar (Ctrl+B)"
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-neutral-800 transition-colors"
            >
              <PanelLeftOpen className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isLoadTestLive = item.path === '/load-testing' && loadTest.isActive;

          if (isCollapsed) {
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `group relative flex items-center justify-center p-2 rounded text-xs font-mono transition-colors border-l-2 ${
                    isActive
                      ? 'bg-neutral-900 text-white border-white font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-950 border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                        }`}
                      />
                      {item.badgeKey && (
                        <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 flex items-center justify-center text-[8px] font-bold rounded-full bg-white text-black border border-black shadow">
                          {metrics.activeInstances}
                        </span>
                      )}
                      {isLoadTestLive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </div>

                    {/* Floating Tooltip popover on hover */}
                    <div className="absolute left-full ml-3 px-2 py-1 bg-neutral-900 border border-neutral-700 text-white text-xs font-mono rounded shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badgeKey && (
                        <span className="text-[9px] px-1 rounded bg-white text-black font-bold">
                          {metrics.activeInstances}
                        </span>
                      )}
                      {isLoadTestLive && (
                        <span className="text-[8px] px-1 rounded bg-white text-black font-bold uppercase">
                          LIVE
                        </span>
                      )}
                    </div>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onItemClick}
              className={({ isActive }) =>
                `group flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors border-l-2 ${
                  isActive
                    ? 'bg-neutral-900 text-white border-white font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-950 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-3.5 h-3.5 transition-colors ${
                        isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badgeKey && (
                    <span
                      className={`text-[9px] px-1 rounded font-mono ${
                        isActive
                          ? 'bg-white text-black font-bold'
                          : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                      }`}
                    >
                      {metrics.activeInstances}
                    </span>
                  )}

                  {isLoadTestLive && (
                    <span className="flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1 rounded bg-white text-black font-mono">
                      LIVE
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Compact Stats */}
      {!isCollapsed ? (
        <div className="p-2 border-t border-neutral-800 bg-black">
          <div className="p-2 rounded bg-neutral-950 border border-neutral-800 space-y-1 text-[10px] font-mono">
            <div className="flex justify-between items-center text-neutral-400">
              <span>Fleet Status:</span>
              <span className="text-white font-semibold">Healthy</span>
            </div>
            <div className="flex justify-between items-center text-neutral-400">
              <span>Target ASG:</span>
              <span className="text-white font-bold">{metrics.activeInstances} / {asgConfig.maxInstances} EC2</span>
            </div>
          </div>
        </div>
      ) : (
        /* Bottom Collapsed Indicator */
        <div className="p-2 border-t border-neutral-800 bg-black flex justify-center">
          <div 
            className="group relative flex items-center justify-center w-8 h-8 rounded bg-neutral-950 border border-neutral-800 cursor-help"
            title={`Fleet Healthy: ${metrics.activeInstances}/${asgConfig.maxInstances} EC2`}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-ping absolute opacity-40" />
            <div className="w-2 h-2 rounded-full bg-white" />
            {/* Tooltip */}
            <div className="absolute left-full ml-3 bottom-0 px-2 py-1 bg-neutral-900 border border-neutral-700 text-white text-[10px] font-mono rounded shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              <div>Fleet: Healthy</div>
              <div className="text-neutral-400">{metrics.activeInstances} / {asgConfig.maxInstances} EC2</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
