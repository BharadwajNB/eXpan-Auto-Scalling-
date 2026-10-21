import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toast } from '../ui/Toast';
import { InstanceDrawer } from '../instances/InstanceDrawer';
import { useSimulation } from '../../hooks/useSimulation';
import { useSystemStore } from '../../store/useSystemStore';
import { X } from 'lucide-react';

export const AppShell: React.FC = () => {
  // Start the background simulation ticker
  useSimulation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleSidebar = useSystemStore((state) => state.toggleSidebar);

  // Global keyboard shortcut: Ctrl+B / Cmd+B to slide sidebar open / closed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Top Header (Compact h-11) */}
      <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar with dynamic slide collapse */}
        <div className="hidden lg:block shrink-0 relative">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-64 max-w-[80vw] bg-black border-r border-neutral-800 flex flex-col z-10 shadow-2xl">
              <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-900"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Sidebar onItemClick={() => setMobileMenuOpen(false)} isMobileDrawer={true} />
            </div>
          </div>
        )}

        {/* Main Application Content Screen */}
        <main className="flex-1 h-full overflow-hidden flex flex-col p-2.5 bg-black">
          <Outlet />
        </main>
      </div>

      {/* Global Instance Detail Drawer */}
      <InstanceDrawer />

      {/* Global Toast Alert */}
      <Toast />
    </div>
  );
};
