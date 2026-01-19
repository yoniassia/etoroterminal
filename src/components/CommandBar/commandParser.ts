export interface ParsedCommand {
  symbol: string | null;
  func: string | null;
  raw: string;
}

const VALID_FUNCTION_CODES = new Set([
  'QT',   // Quote
  'WL',   // Watchlist
  'TRD',  // Trade
  'ORD',  // Orders
  'PF',   // Portfolio
  'PI',   // Position Info
  'CH',   // Chart
  'AL',   // Alerts
]);

export function isValidFunctionCode(code: string): boolean {
  return VALID_FUNCTION_CODES.has(code.toUpperCase());
}

export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();
  const upperInput = raw.toUpperCase();

  if (!raw) {
    return { symbol: null, func: null, raw };
  }

  const parts = upperInput.split(/\s+/);

  // Single token: could be SYMBOL or FUNC
  if (parts.length === 1) {
    const token = parts[0];
    if (isValidFunctionCode(token)) {
      return { symbol: null, func: token, raw };
    }
    // Treat as symbol
    return { symbol: token, func: null, raw };
  }

  // Two or more tokens: SYMBOL + FUNC pattern
  // First token is symbol, second is function code
  const [symbolPart, funcPart] = parts;

  if (isValidFunctionCode(funcPart)) {
    return { symbol: symbolPart, func: funcPart, raw };
  }

  // If second part is not a valid function code, treat whole input as symbol
  return { symbol: symbolPart, func: null, raw };
}

export function getValidFunctionCodes(): string[] {
  return Array.from(VALID_FUNCTION_CODES);
}
