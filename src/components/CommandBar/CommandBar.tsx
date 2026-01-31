import React, { useState, useRef, useCallback, useEffect } from 'react';
import { symbolResolver, SymbolSearchResult } from '../../services/symbolResolver';
import { Autocomplete, AutocompleteItem } from './Autocomplete';
import './CommandBar.css';

export interface CommandBarCommand {
  type: 'function' | 'symbol';
  code?: string;
  symbol?: SymbolSearchResult;
  raw: string;
}

interface CommandBarProps {
  onCommand?: (command: CommandBarCommand) => void;
  placeholder?: string;
}

interface FunctionCode {
  code: string;
  name: string;
  description: string;
}

const FUNCTION_CODES: FunctionCode[] = [
  { code: 'QT', name: 'Quote', description: 'Get price quote for symbol' },
  { code: 'WL', name: 'Watchlist', description: 'View/manage watchlist' },
  { code: 'WLM', name: 'Watchlist Monitor', description: 'Monitor watchlist prices' },
  { code: 'CUR', name: 'Curated Lists', description: 'Browse curated lists' },
  { code: 'REC', name: 'Recommendations', description: 'View recommendations' },
  { code: 'TRD', name: 'Trade', description: 'Execute trade' },
  { code: 'ORD', name: 'Orders', description: 'View pending orders' },
  { code: 'PF', name: 'Portfolio', description: 'View portfolio positions' },
  { code: 'PI', name: 'Trader Search', description: 'Search for traders' },
  { code: 'PIP', name: 'Trader Profile', description: 'View trader profile' },
  { code: 'CH', name: 'Chart', description: 'View price chart' },
  { code: 'AL', name: 'Alerts', description: 'Manage price alerts' },
  { code: 'FEED', name: 'Feeds', description: 'View social feeds' },
  { code: 'API', name: 'API Tester', description: 'Test API endpoints' },
  { code: 'HELP', name: 'Help', description: 'View help documentation' },
  { code: 'STATUS', name: 'Status', description: 'Connection status' },
  { code: 'SB', name: 'Strategy Builder', description: 'AI-powered strategy creation' },
  { code: 'STRAT', name: 'Strategy Builder', description: 'AI-powered strategy creation (alias)' },
  { code: 'FB', name: 'Feedback', description: 'Submit feedback and suggestions' },
  { code: 'FEEDBACK', name: 'Feedback', description: 'Submit feedback and suggestions (alias)' },
  { code: 'INS', name: 'Insider Activity', description: 'View insider trades & sentiment' },
  { code: 'INSIDER', name: 'Insider Activity', description: 'View insider trades & sentiment (alias)' },
  { code: 'INST', name: 'Institutional', description: 'Who owns what - 13F filings' },
  { code: 'WHALE', name: 'Institutional', description: 'Track Buffett, Soros, BlackRock holdings' },
  { code: 'FD', name: 'Fundamentals', description: 'Income statements, EPS, margins' },
  { code: 'FUND', name: 'Fundamentals', description: 'Financial statements (alias)' },
  { code: 'FILINGS', name: 'SEC Filings', description: '10-K, 10-Q, 8-K filings' },
  { code: 'SEC', name: 'SEC Filings', description: 'Browse SEC filings (alias)' },
  { code: 'QUANT', name: 'Quant Chat', description: 'Chat with your AI trading co-pilot' },
  { code: 'CHAT', name: 'Quant Chat', description: 'AI assistant (alias)' },
  { code: 'AI', name: 'Quant Chat', description: 'AI assistant (alias)' },
];

export const CommandBar: React.FC<CommandBarProps> = ({
  onCommand,
  placeholder = 'Enter command (e.g., AAPL QT, WL, TRD TSLA)...',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowAutocomplete(false);
      return;
    }

    const upperQuery = query.toUpperCase().trim();
    const items: AutocompleteItem[] = [];

    const matchingFunctions = FUNCTION_CODES.filter(
      (fc) =>
        fc.code.startsWith(upperQuery) ||
        fc.name.toUpperCase().includes(upperQuery)
    );

    for (const fc of matchingFunctions) {
      items.push({
        type: 'function',
        label: fc.code,
        description: `${fc.name} - ${fc.description}`,
        value: fc.code,
      });
    }

    try {
      const symbolResults = await symbolResolver.searchSymbols(query, 8);
      for (const sym of symbolResults) {
        items.push({
          type: 'symbol',
          label: sym.symbol,
          description: sym.name,
          value: sym.symbol,
          data: sym,
        });
      }
    } catch {
      // Silently handle symbol search errors
    }

    setSuggestions(items);
    setSelectedIndex(0);
    setShowAutocomplete(items.length > 0);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSuggestions(value);
    }, 150);
  };

  const handleSelectItem = useCallback(
    (item: AutocompleteItem) => {
      if (item.type === 'function') {
        setInputValue(item.value + ' ');
        onCommand?.({
          type: 'function',
          code: item.value,
          raw: item.value,
        });
      } else if (item.type === 'symbol' && item.data) {
        setInputValue(item.value + ' ');
        onCommand?.({
          type: 'symbol',
          symbol: item.data,
          raw: item.value,
        });
      }
      setShowAutocomplete(false);
      setSuggestions([]);
      inputRef.current?.focus();
    },
    [onCommand]
  );

  const handleExecute = useCallback(() => {
    if (inputValue.trim()) {
      parseAndExecuteCommand(inputValue.trim());
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key always executes command (with or without autocomplete)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showAutocomplete && suggestions[selectedIndex]) {
        handleSelectItem(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        parseAndExecuteCommand(inputValue.trim());
      }
      return;
    }

    if (!showAutocomplete) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Escape':
        e.preventDefault();
        setShowAutocomplete(false);
        setSuggestions([]);
        break;
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          handleSelectItem(suggestions[selectedIndex]);
        }
        break;
    }
  };

  const parseAndExecuteCommand = async (input: string) => {
    const parts = input.toUpperCase().split(/\s+/);
    
    const funcMatch = FUNCTION_CODES.find((fc) => parts.includes(fc.code));
    if (funcMatch) {
      const symbolPart = parts.find((p) => p !== funcMatch.code);
      if (symbolPart) {
        const resolved = await symbolResolver.resolveSymbol(symbolPart);
        if (resolved) {
          onCommand?.({
            type: 'function',
            code: funcMatch.code,
            symbol: resolved,
            raw: input,
          });
        } else {
          onCommand?.({
            type: 'function',
            code: funcMatch.code,
            raw: input,
          });
        }
      } else {
        onCommand?.({
          type: 'function',
          code: funcMatch.code,
          raw: input,
        });
      }
      setInputValue('');
      return;
    }

    const resolved = await symbolResolver.resolveSymbol(parts[0]);
    if (resolved) {
      onCommand?.({
        type: 'symbol',
        symbol: resolved,
        raw: input,
      });
      setInputValue('');
    }
  };

  const handleFunctionCodeClick = (code: string) => {
    setInputValue(code + ' ');
    inputRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="command-bar" role="search">
      <div className="command-bar-input-wrapper">
        <span className="command-bar-prompt" aria-hidden="true">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          className="command-bar-input"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setTimeout(() => setShowAutocomplete(false), 200);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowAutocomplete(true);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          aria-label="Command bar - enter symbol or function code"
          aria-autocomplete="list"
          aria-expanded={showAutocomplete}
          aria-controls="command-suggestions"
          aria-activedescendant={showAutocomplete && suggestions[selectedIndex] ? `suggestion-${selectedIndex}` : undefined}
          role="combobox"
        />
        <button 
          className="command-bar-execute-btn"
          onClick={handleExecute}
          type="button"
          aria-label="Execute command"
        >
          [ GO ]
        </button>
      </div>
      <nav className="command-bar-function-codes" aria-label="Quick function codes">
        {FUNCTION_CODES.map((fc) => (
          <button
            key={fc.code}
            className="function-code"
            onClick={() => handleFunctionCodeClick(fc.code)}
            aria-label={`${fc.name}: ${fc.description}`}
          >
            {fc.code}
          </button>
        ))}
      </nav>
      <Autocomplete
        items={suggestions}
        selectedIndex={selectedIndex}
        onSelect={handleSelectItem}
        visible={showAutocomplete}
      />
    </div>
  );
};

export default CommandBar;
