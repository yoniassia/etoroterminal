import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { PanelRegistry, PanelInstance } from '../components/Workspace/PanelRegistry';

// Default panels to open on startup - comprehensive terminal view
const DEFAULT_PANELS = ['STATUS', 'WL', 'WLM', 'PF', 'QT', 'CH', 'ORD'];

interface WorkspaceContextValue {
  panels: PanelInstance[];
  addPanel: (typeId: string) => string | null;
  removePanel: (instanceId: string) => void;
  openPanelForSymbol: (typeId: string, symbol?: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

let instanceCounter = 0;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<PanelInstance[]>([]);
  const initializedRef = useRef(false);

  const addPanel = useCallback((typeId: string): string | null => {
    const config = PanelRegistry.get(typeId);
    if (!config) {
      console.warn(`Panel type "${typeId}" not registered. Available:`, PanelRegistry.getRegisteredTypes());
      return null;
    }

    const instanceId = `panel-${++instanceCounter}`;
    const instance: PanelInstance = {
      instanceId,
      typeId,
      title: config.title,
      width: config.defaultWidth,
      height: config.defaultHeight,
    };

    setPanels((prev) => [...prev, instance]);
    console.log(`Added panel: ${typeId} (${instanceId})`);
    return instanceId;
  }, []);

  const removePanel = useCallback((instanceId: string) => {
    setPanels((prev) => prev.filter((p) => p.instanceId !== instanceId));
  }, []);

  const openPanelForSymbol = useCallback((typeId: string, symbol?: string) => {
    console.log(`Opening panel ${typeId} for symbol ${symbol || 'none'}`);
    addPanel(typeId);
  }, [addPanel]);

  // Open default panels on mount - try multiple times if registry not ready
  useEffect(() => {
    if (initializedRef.current) return;

    const tryInitialize = (attempt: number) => {
      const registeredTypes = PanelRegistry.getRegisteredTypes();
      console.log(`Initialization attempt ${attempt}, registered types:`, registeredTypes);

      if (registeredTypes.length > 0) {
        initializedRef.current = true;
        
        // Add default panels
        const addedPanels: string[] = [];
        DEFAULT_PANELS.forEach((typeId) => {
          if (PanelRegistry.get(typeId)) {
            const config = PanelRegistry.get(typeId)!;
            const instanceId = `panel-${++instanceCounter}`;
            addedPanels.push(typeId);
            setPanels((prev) => [...prev, {
              instanceId,
              typeId,
              title: config.title,
              width: config.defaultWidth,
              height: config.defaultHeight,
            }]);
          } else {
            console.warn(`Default panel ${typeId} not found in registry`);
          }
        });
        
        console.log('Default panels added:', addedPanels);
      } else if (attempt < 10) {
        // Retry after a delay
        setTimeout(() => tryInitialize(attempt + 1), 200);
      } else {
        console.error('Failed to initialize default panels after 10 attempts');
      }
    };

    // Start initialization
    tryInitialize(1);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ panels, addPanel, removePanel, openPanelForSymbol }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  }
  return context;
}
