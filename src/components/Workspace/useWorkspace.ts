import { useState, useCallback } from 'react';
import { PanelRegistry, PanelInstance } from './PanelRegistry';

let instanceCounter = 0;

export function useWorkspace() {
  const [panels, setPanels] = useState<PanelInstance[]>([]);

  const addPanel = useCallback((typeId: string) => {
    const config = PanelRegistry.get(typeId);
    if (!config) {
      console.warn(`Panel type "${typeId}" not registered`);
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
    return instanceId;
  }, []);

  const removePanel = useCallback((instanceId: string) => {
    setPanels((prev) => prev.filter((p) => p.instanceId !== instanceId));
  }, []);

  const resizePanel = useCallback(
    (instanceId: string, width?: number, height?: number) => {
      setPanels((prev) =>
        prev.map((p) =>
          p.instanceId === instanceId
            ? { ...p, width: width ?? p.width, height: height ?? p.height }
            : p
        )
      );
    },
    []
  );

  return {
    panels,
    addPanel,
    removePanel,
    resizePanel,
  };
}
