import React from 'react';
import { SymbolSearchResult } from '../../services/symbolResolver';

export interface AutocompleteItem {
  type: 'symbol' | 'function';
  label: string;
  description: string;
  value: string;
  data?: SymbolSearchResult;
}

interface AutocompleteProps {
  items: AutocompleteItem[];
  selectedIndex: number;
  onSelect: (item: AutocompleteItem) => void;
  visible: boolean;
}

const autocompleteStyles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#0a0e1a',
    border: '1px solid #00ff00',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    maxHeight: '250px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #003300',
    transition: 'background-color 0.15s',
  },
  itemSelected: {
    backgroundColor: '#002200',
  },
  itemLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  label: {
    color: '#00ff00',
    fontSize: '14px',
    fontFamily: "'Courier New', monospace",
    fontWeight: 'bold',
  },
  description: {
    color: '#00cc00',
    fontSize: '12px',
    fontFamily: "'Courier New', monospace",
  },
  type: {
    color: '#006600',
    fontSize: '11px',
    fontFamily: "'Courier New', monospace",
    padding: '2px 6px',
    border: '1px solid #004400',
    borderRadius: '2px',
  },
  empty: {
    padding: '12px',
    color: '#006600',
    fontSize: '13px',
    fontFamily: "'Courier New', monospace",
    textAlign: 'center' as const,
  },
};

export const Autocomplete: React.FC<AutocompleteProps> = ({
  items,
  selectedIndex,
  onSelect,
  visible,
}) => {
  if (!visible || items.length === 0) {
    return null;
  }

  return (
    <div 
      style={autocompleteStyles.container}
      id="command-suggestions"
      role="listbox"
      aria-label="Suggestions"
    >
      {items.map((item, index) => (
        <div
          key={`${item.type}-${item.value}-${index}`}
          id={`suggestion-${index}`}
          style={{
            ...autocompleteStyles.item,
            ...(index === selectedIndex ? autocompleteStyles.itemSelected : {}),
          }}
          onClick={() => onSelect(item)}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = '#002200';
          }}
          onMouseLeave={(e) => {
            if (index !== selectedIndex) {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
            }
          }}
          role="option"
          aria-selected={index === selectedIndex}
          aria-label={`${item.label}: ${item.description}`}
        >
          <div style={autocompleteStyles.itemLeft}>
            <span style={autocompleteStyles.label}>{item.label}</span>
            <span style={autocompleteStyles.description}>{item.description}</span>
          </div>
          <span style={autocompleteStyles.type} aria-hidden="true">
            {item.type === 'function' ? 'CMD' : 'SYM'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default Autocomplete;
