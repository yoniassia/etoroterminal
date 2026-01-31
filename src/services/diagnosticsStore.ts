// Diagnostics log store for debugging and support bundles

export type LogType = 'request' | 'response' | 'ws_event' | 'error';

export interface LogEntry {
  id: string;
  type: LogType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface ErrorLogData {
  message: string;
  stack?: string;
  source?: string;
  context?: Record<string, unknown>;
}

export interface RequestLogData {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ResponseLogData {
  status: number;
  statusText: string;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  durationMs?: number;
}

export interface WSEventData {
  event: 'connect' | 'disconnect' | 'message' | 'error' | 'reconnect' | 'subscribe' | 'unsubscribe';
  topic?: string;
  payload?: unknown;
  error?: string;
}

export interface AppSettings {
  tradingMode: string;
  featureFlags: Record<string, boolean>;
  userAgent: string;
  screenResolution: string;
  timezone: string;
}

export interface DiagnosticsBundle {
  exportedAt: string;
  appVersion: string;
  bundleVersion: string;
  settings: AppSettings;
  entryCount: number;
  restLogs: LogEntry[];
  wsLogs: LogEntry[];
  errors: LogEntry[];
}

const MAX_ENTRIES = 500;
const SENSITIVE_HEADERS = ['x-api-key', 'x-user-key', 'authorization', 'cookie', 'set-cookie'];
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'userKey', 'key'];

class DiagnosticsStore {
  private entries: LogEntry[] = [];
  private idCounter = 0;

  private generateId(): string {
    return `log_${Date.now()}_${++this.idCounter}`;
  }

  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) return undefined;

    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private addEntry(type: LogType, data: Record<string, unknown>): void {
    const entry: LogEntry = {
      id: this.generateId(),
      type,
      timestamp: new Date().toISOString(),
      data,
    };

    this.entries.push(entry);

    if (this.entries.length > MAX_ENTRIES) {
      this.entries.shift();
    }
  }

  logRequest(req: RequestLogData): void {
    this.addEntry('request', {
      method: req.method,
      url: req.url,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeObject(req.body),
    });
  }

  logResponse(res: ResponseLogData): void {
    this.addEntry('response', {
      status: res.status,
      statusText: res.statusText,
      url: res.url,
      headers: this.sanitizeHeaders(res.headers),
      body: this.sanitizeObject(res.body),
      durationMs: res.durationMs,
    });
  }

  logWSEvent(event: WSEventData): void {
    this.addEntry('ws_event', {
      event: event.event,
      topic: event.topic,
      payload: this.sanitizeObject(event.payload),
      error: event.error,
    });
  }

  logError(error: ErrorLogData): void {
    this.addEntry('error', {
      message: error.message,
      stack: error.stack,
      source: error.source,
      context: this.sanitizeObject(error.context),
    });
  }

  getErrors(): LogEntry[] {
    return this.entries.filter((entry) => entry.type === 'error');
  }

  getLogs(type?: LogType): LogEntry[] {
    if (type) {
      return this.entries.filter((entry) => entry.type === type);
    }
    return [...this.entries];
  }

  exportBundle(settings?: Partial<AppSettings>): DiagnosticsBundle {
    const restLogs = this.entries.filter(
      (e) => e.type === 'request' || e.type === 'response'
    );
    const wsLogs = this.entries.filter((e) => e.type === 'ws_event');
    const errors = this.entries.filter((e) => e.type === 'error');

    const appSettings: AppSettings = {
      tradingMode: settings?.tradingMode ?? 'UNKNOWN',
      featureFlags: settings?.featureFlags ?? {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      screenResolution:
        typeof window !== 'undefined'
          ? `${window.screen.width}x${window.screen.height}`
          : 'N/A',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    return {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      bundleVersion: '1.0.0',
      settings: appSettings,
      entryCount: this.entries.length,
      restLogs: restLogs.map((log) => ({
        ...log,
        data: this.sanitizeObject(log.data) as Record<string, unknown>,
      })),
      wsLogs: wsLogs.map((log) => ({
        ...log,
        data: this.sanitizeObject(log.data) as Record<string, unknown>,
      })),
      errors: errors.map((log) => ({
        ...log,
        data: this.sanitizeObject(log.data) as Record<string, unknown>,
      })),
    };
  }

  clear(): void {
    this.entries = [];
  }

  get count(): number {
    return this.entries.length;
  }
}

export const diagnosticsStore = new DiagnosticsStore();
