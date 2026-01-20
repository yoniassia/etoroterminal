import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { PanelRegistry, PanelInstance } from '../components/Workspace/PanelRegistry';
import { workspaceLayoutService } from '../services/workspaceLayoutService';

// Default panels to open on startup - comprehensive terminal view
const DEFAULT_PANELS = ['STATUS', 'WL', 'WLM', 'PF', 'QT', 'CH', 'ORD'];

interface WorkspaceContextValue {
  panels: PanelInstance[];
  addPanel: (typeId: string) => string | null;
  removePanel: (instanceId: string) => void;
  openPanelForSymbol: (typeId: string, symbol?: string, instrumentId?: number) => void;
  movePanel: (fromIndex: number, toIndex: number) => void;
  saveAsDefault: () => void;
  resetToDefault: () => void;
  hasCustomLayout: boolean;
  pendingSymbol: { symbol: string; instrumentId?: number } | null;
  getPendingSymbol: () => { symbol: string; instrumentId?: number } | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

let instanceCounter = 0;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [panels, setPanels] = useState<PanelInstance[]>([]);
  const [hasCustomLayout, setHasCustomLayout] = useState(false);
  const [pendingSymbol, setPendingSymbol] = useState<{ symbol: string; instrumentId?: number } | null>(null);
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

  const openPanelForSymbol = useCallback((typeId: string, symbol?: string, instrumentId?: number) => {
    console.log(`Opening panel ${typeId} for symbol ${symbol || 'none'}`);
    if (symbol) {
      setPendingSymbol({ symbol, instrumentId });
    }
    addPanel(typeId);
  }, [addPanel]);

  const getPendingSymbol = useCallback(() => {
    const sym = pendingSymbol;
    setPendingSymbol(null);
    return sym;
  }, [pendingSymbol]);

  const movePanel = useCallback((fromIndex: number, toIndex: number) => {
    setPanels((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev;
      }
      const newPanels = [...prev];
      const [movedPanel] = newPanels.splice(fromIndex, 1);
      newPanels.splice(toIndex, 0, movedPanel);
      return newPanels;
    });
  }, []);

  const saveAsDefault = useCallback(() => {
    const typeIds = panels.map((p) => p.typeId);
    workspaceLayoutService.saveLayout(typeIds);
    setHasCustomLayout(true);
    console.log('Saved workspace layout:', typeIds);
  }, [panels]);

  const resetToDefault = useCallback(() => {
    workspaceLayoutService.resetLayout();
    setHasCustomLayout(false);
    
    // Clear current panels and load defaults
    setPanels([]);
    instanceCounter = 0;
    
    setTimeout(() => {
      const newPanels: PanelInstance[] = [];
      DEFAULT_PANELS.forEach((typeId) => {
        const config = PanelRegistry.get(typeId);
        if (config) {
          const instanceId = `panel-${++instanceCounter}`;
          newPanels.push({
            instanceId,
            typeId,
            title: config.title,
            width: config.defaultWidth,
            height: config.defaultHeight,
          });
        }
      });
      setPanels(newPanels);
      console.log('Reset to default layout:', DEFAULT_PANELS);
    }, 50);
  }, []);

  // Open panels on mount - load saved layout or defaults
  useEffect(() => {
    if (initializedRef.current) return;

    const tryInitialize = (attempt: number) => {
      const registeredTypes = PanelRegistry.getRegisteredTypes();
      console.log(`Initialization attempt ${attempt}, registered types:`, registeredTypes);

      if (registeredTypes.length > 0) {
        initializedRef.current = true;
        
        // Check for saved layout
        const savedLayout = workspaceLayoutService.loadLayout();
        const panelsToLoad = savedLayout || DEFAULT_PANELS;
        setHasCustomLayout(!!savedLayout);
        
        console.log('Loading layout:', panelsToLoad, savedLayout ? '(custom)' : '(default)');

        // Add panels
        const addedPanels: string[] = [];
        panelsToLoad.forEach((typeId) => {
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
            console.warn(`Panel ${typeId} not found in registry`);
          }
        });
        
        console.log('Panels loaded:', addedPanels);
      } else if (attempt < 10) {
        setTimeout(() => tryInitialize(attempt + 1), 200);
      } else {
        console.error('Failed to initialize panels after 10 attempts');
      }
    };

    tryInitialize(1);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ 
      panels, 
      addPanel, 
      removePanel, 
      openPanelForSymbol,
      movePanel,
      saveAsDefault,
      resetToDefault,
      hasCustomLayout,
      pendingSymbol,
      getPendingSymbol,
    }}>
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
