// REST Adapter for eToro API
// Provides base HTTP client with interceptors, retry logic, and error handling

import { API_BASE_URL, REQUIRED_HEADERS, CONTENT_TYPE_JSON, API_STATUS } from './contracts/endpoints';
import type { ApiError, ApiHeaders } from './contracts/etoro-api.types';

// ============================================================================
// Types
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface RestAdapterConfig {
  apiKey: string;
  userKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  onRequest?: RequestInterceptor;
  onResponse?: ResponseInterceptor;
  onError?: ErrorInterceptor;
}

export interface RequestContext {
  requestId: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: unknown;
  timestamp: number;
}

export interface ResponseContext {
  requestId: string;
  url: string;
  method: HttpMethod;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: unknown;
  duration: number;
}

export interface RestError extends Error {
  code: string;
  status: number;
  requestId: string;
  details?: Record<string, unknown>;
  isRetryable: boolean;
}

export type RequestInterceptor = (context: RequestContext) => void;
export type ResponseInterceptor = (context: ResponseContext) => void;
export type ErrorInterceptor = (error: RestError, context: RequestContext) => void;

// ============================================================================
// UUID Generation
// ============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// Error Handling
// ============================================================================

function isRetryableStatus(status: number): boolean {
  return (
    status === API_STATUS.RATE_LIMITED ||
    status === API_STATUS.SERVER_ERROR ||
    status >= 502 && status <= 504
  );
}

function createRestError(
  message: string,
  code: string,
  status: number,
  requestId: string,
  details?: Record<string, unknown>
): RestError {
  const error = new Error(message) as RestError;
  error.name = 'RestError';
  error.code = code;
  error.status = status;
  error.requestId = requestId;
  error.details = details;
  error.isRetryable = isRetryableStatus(status);
  return error;
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const data = await response.json();
    return {
      code: data.code || `HTTP_${response.status}`,
      message: data.message || response.statusText,
      details: data.details,
    };
  } catch {
    return {
      code: `HTTP_${response.status}`,
      message: response.statusText || 'Unknown error',
    };
  }
}

// ============================================================================
// Logging Utilities
// ============================================================================

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === 'x-api-key' || lowerKey === 'x-user-key' || lowerKey === 'authorization') {
      sanitized[key] = value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : '****';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

function defaultRequestInterceptor(context: RequestContext): void {
  console.log(`[REST] → ${context.method} ${context.url}`, {
    requestId: context.requestId,
    headers: sanitizeHeaders(context.headers),
  });
}

function defaultResponseInterceptor(context: ResponseContext): void {
  console.log(`[REST] ← ${context.status} ${context.url}`, {
    requestId: context.requestId,
    duration: `${context.duration}ms`,
  });
}

function defaultErrorInterceptor(error: RestError, context: RequestContext): void {
  console.error(`[REST] ✕ ${error.status} ${context.url}`, {
    requestId: error.requestId,
    code: error.code,
    message: error.message,
    isRetryable: error.isRetryable,
  });
}

// ============================================================================
// REST Adapter Class
// ============================================================================

export class RestAdapter {
  private readonly apiKey: string;
  private readonly userKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly onRequest: RequestInterceptor;
  private readonly onResponse: ResponseInterceptor;
  private readonly onError: ErrorInterceptor;

  constructor(config: RestAdapterConfig) {
    this.apiKey = config.apiKey;
    this.userKey = config.userKey;
    this.baseUrl = config.baseUrl || API_BASE_URL;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelay = config.retryDelay || 1000;
    this.onRequest = config.onRequest || defaultRequestInterceptor;
    this.onResponse = config.onResponse || defaultResponseInterceptor;
    this.onError = config.onError || defaultErrorInterceptor;
  }

  private buildHeaders(method: HttpMethod, additionalHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      [REQUIRED_HEADERS.REQUEST_ID]: generateUUID(),
      [REQUIRED_HEADERS.API_KEY]: this.apiKey,
      [REQUIRED_HEADERS.USER_KEY]: this.userKey,
    };

    if (method !== 'GET') {
      headers['Content-Type'] = CONTENT_TYPE_JSON;
    }

    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders);
    }

    return headers;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    context: RequestContext,
    retries: number,
    delay: number
  ): Promise<T> {
    let lastError: RestError | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as RestError;

        if (!lastError.isRetryable || attempt === retries) {
          throw lastError;
        }

        const backoffDelay = delay * Math.pow(2, attempt);
        console.log(`[REST] Retry ${attempt + 1}/${retries} after ${backoffDelay}ms`, {
          requestId: context.requestId,
        });
        await this.sleep(backoffDelay);
      }
    }

    throw lastError;
  }

  async makeRequest<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method || 'GET';
    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(method, options.headers);
    const requestId = headers[REQUIRED_HEADERS.REQUEST_ID];
    const startTime = Date.now();

    const context: RequestContext = {
      requestId,
      url,
      method,
      headers,
      body: options.body,
      timestamp: startTime,
    };

    this.onRequest(context);

    const retries = options.retries ?? this.maxRetries;
    const retryDelay = options.retryDelay ?? this.retryDelay;

    const executeRequest = async (): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

      try {
        const fetchOptions: RequestInit = {
          method,
          headers,
          mode: 'cors',
          signal: controller.signal,
        };

        if (options.body && method !== 'GET') {
          fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url, fetchOptions);
        const duration = Date.now() - startTime;

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        if (!response.ok) {
          const apiError = await parseErrorResponse(response);
          const error = createRestError(
            apiError.message,
            apiError.code,
            response.status,
            requestId,
            apiError.details
          );
          this.onError(error, context);
          throw error;
        }

        const data = (await response.json()) as T;

        const responseContext: ResponseContext = {
          requestId,
          url,
          method,
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          data,
          duration,
        };

        this.onResponse(responseContext);

        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    return this.executeWithRetry(executeRequest, context, retries, retryDelay);
  }

  async get<T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T = unknown>(endpoint: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async delete<T = unknown>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createRestAdapter(config: RestAdapterConfig): RestAdapter {
  return new RestAdapter(config);
}

// ============================================================================
// Default Instance (singleton pattern)
// ============================================================================

import { keyManager } from '../services/keyManager';

let defaultAdapter: RestAdapter | null = null;

export function getDefaultAdapter(): RestAdapter {
  const keys = keyManager.getKeys();
  
  // Always create a new adapter with current keys to ensure they're up to date
  if (keys) {
    defaultAdapter = new RestAdapter({
      apiKey: keys.apiKey,
      userKey: keys.userKey,
    });
  } else if (!defaultAdapter) {
    // Fallback to empty keys if no keys configured
    defaultAdapter = new RestAdapter({
      apiKey: '',
      userKey: '',
    });
  }
  return defaultAdapter;
}

export function setDefaultAdapter(adapter: RestAdapter): void {
  defaultAdapter = adapter;
}

export function resetDefaultAdapter(): void {
  defaultAdapter = null;
}
