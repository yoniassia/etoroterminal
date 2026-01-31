interface SavedLayout {
  version: string;
  panels: string[];
  savedAt: string;
}

const STORAGE_KEY = 'etoro-terminal-layout';
const LAYOUT_VERSION = '1.0';

export const workspaceLayoutService = {
  saveLayout(panelTypeIds: string[]): void {
    try {
      const layout: SavedLayout = {
        version: LAYOUT_VERSION,
        panels: panelTypeIds,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch (error) {
      console.warn('Failed to save workspace layout:', error);
    }
  },

  loadLayout(): string[] | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      const layout: SavedLayout = JSON.parse(stored);
      if (!layout.panels || !Array.isArray(layout.panels)) {
        console.warn('Invalid layout format in storage');
        return null;
      }
      return layout.panels;
    } catch (error) {
      console.warn('Failed to load workspace layout:', error);
      return null;
    }
  },

  resetLayout(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset workspace layout:', error);
    }
  },

  hasCustomLayout(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch (error) {
      console.warn('Failed to check workspace layout:', error);
      return false;
    }
  },
};
