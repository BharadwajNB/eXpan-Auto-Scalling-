import { useEffect } from 'react';
import { useSystemStore } from '../store/useSystemStore';

export function useSimulation() {
  const tickSimulation = useSystemStore((state) => state.tickSimulation);
  const simulationRunning = useSystemStore((state) => state.simulationRunning);
  const simulationSpeed = useSystemStore((state) => state.simulationSpeed);

  useEffect(() => {
    // Initial fetch on mount
    tickSimulation();

    if (!simulationRunning) return;

    // Adjust polling interval based on chosen telemetry speed:
    // 1x = 2000ms (normal)
    // 2x = 1000ms (fast)
    // 4x = 500ms (turbo / real-time)
    const intervalMs = simulationSpeed === '4x' ? 500 : simulationSpeed === '2x' ? 1000 : 2000;

    const interval = setInterval(() => {
      tickSimulation();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [tickSimulation, simulationRunning, simulationSpeed]);
}
