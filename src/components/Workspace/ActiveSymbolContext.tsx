import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type LinkGroup = 'A' | 'B' | 'C' | null;

export interface ActiveSymbolState {
  symbol: string | null;
  groupSymbols: Record<Exclude<LinkGroup, null>, string | null>;
}

export interface ActiveSymbolContextValue {
  activeSymbol: string | null;
  groupSymbols: Record<Exclude<LinkGroup, null>, string | null>;
  setActiveSymbol: (symbol: string, group?: LinkGroup) => void;
  getSymbolForGroup: (group: LinkGroup) => string | null;
}

const defaultState: ActiveSymbolState = {
  symbol: null,
  groupSymbols: { A: null, B: null, C: null },
};

const ActiveSymbolContext = createContext<ActiveSymbolContextValue | null>(null);

export interface ActiveSymbolProviderProps {
  children: ReactNode;
}

export function ActiveSymbolProvider({ children }: ActiveSymbolProviderProps) {
  const [state, setState] = useState<ActiveSymbolState>(defaultState);

  const setActiveSymbol = useCallback((symbol: string, group?: LinkGroup) => {
    setState((prev) => {
      const newGroupSymbols = { ...prev.groupSymbols };
      if (group) {
        newGroupSymbols[group] = symbol;
      } else {
        newGroupSymbols.A = symbol;
        newGroupSymbols.B = symbol;
        newGroupSymbols.C = symbol;
      }
      return {
        symbol,
        groupSymbols: newGroupSymbols,
      };
    });
  }, []);

  const getSymbolForGroup = useCallback(
    (group: LinkGroup): string | null => {
      if (!group) return state.symbol;
      return state.groupSymbols[group];
    },
    [state]
  );

  const value: ActiveSymbolContextValue = {
    activeSymbol: state.symbol,
    groupSymbols: state.groupSymbols,
    setActiveSymbol,
    getSymbolForGroup,
  };

  return (
    <ActiveSymbolContext.Provider value={value}>
      {children}
    </ActiveSymbolContext.Provider>
  );
}

export function useActiveSymbol(): ActiveSymbolContextValue {
  const context = useContext(ActiveSymbolContext);
  if (!context) {
    throw new Error('useActiveSymbol must be used within an ActiveSymbolProvider');
  }
  return context;
}
