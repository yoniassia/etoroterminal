import { ComponentType } from 'react';

export interface PanelConfig {
  id: string;
  title: string;
  component: ComponentType<PanelContentProps>;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
}

export interface PanelContentProps {
  panelId: string;
}

export interface PanelInstance {
  instanceId: string;
  typeId: string;
  title: string;
  width?: number;
  height?: number;
}

class PanelRegistryClass {
  private panels: Map<string, PanelConfig> = new Map();

  register(config: PanelConfig): void {
    this.panels.set(config.id, config);
  }

  unregister(id: string): boolean {
    return this.panels.delete(id);
  }

  get(id: string): PanelConfig | undefined {
    return this.panels.get(id);
  }

  getAll(): PanelConfig[] {
    return Array.from(this.panels.values());
  }

  has(id: string): boolean {
    return this.panels.has(id);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.panels.keys());
  }
}

export const PanelRegistry = new PanelRegistryClass();
