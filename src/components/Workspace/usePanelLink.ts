import { useState, useCallback, useMemo } from 'react';
import { useActiveSymbol, LinkGroup } from './ActiveSymbolContext';

export interface PanelLinkState {
  linkGroup: LinkGroup;
  isPinned: boolean;
  pinnedSymbol: string | null;
}

export interface PanelLinkActions {
  setLinkGroup: (group: LinkGroup) => void;
  togglePin: () => void;
  pin: (symbol: string) => void;
  unpin: () => void;
}

export interface UsePanelLinkReturn extends PanelLinkState, PanelLinkActions {
  currentSymbol: string | null;
}

export function usePanelLink(initialGroup: LinkGroup = 'A'): UsePanelLinkReturn {
  const { getSymbolForGroup, activeSymbol } = useActiveSymbol();
  const [linkGroup, setLinkGroup] = useState<LinkGroup>(initialGroup);
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedSymbol, setPinnedSymbol] = useState<string | null>(null);

  const currentSymbol = useMemo(() => {
    if (isPinned) return pinnedSymbol;
    if (linkGroup) return getSymbolForGroup(linkGroup);
    return activeSymbol;
  }, [isPinned, pinnedSymbol, linkGroup, getSymbolForGroup, activeSymbol]);

  const togglePin = useCallback(() => {
    setIsPinned((prev) => {
      if (!prev && currentSymbol) {
        setPinnedSymbol(currentSymbol);
      }
      return !prev;
    });
  }, [currentSymbol]);

  const pin = useCallback((symbol: string) => {
    setIsPinned(true);
    setPinnedSymbol(symbol);
  }, []);

  const unpin = useCallback(() => {
    setIsPinned(false);
    setPinnedSymbol(null);
  }, []);

  return {
    linkGroup,
    isPinned,
    pinnedSymbol,
    currentSymbol,
    setLinkGroup,
    togglePin,
    pin,
    unpin,
  };
}
