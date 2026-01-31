/**
 * Unified API Service singleton
 * Combines REST adapter with key manager for automatic API key injection
 */

import { RestAdapter, type RestAdapterConfig, type RequestOptions } from '../api/restAdapter';
import { keyManager } from './keyManager';

export class ApiServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

class ApiService {
  private adapter: RestAdapter | null = null;

  private ensureAdapter(): RestAdapter {
    if (this.adapter) {
      return this.adapter;
    }

    const keys = keyManager.getKeys();
    if (!keys) {
      throw new ApiServiceError('API keys not configured. Please set keys using keyManager.setKeys()');
    }

    this.adapter = new RestAdapter({
      apiKey: keys.apiKey,
      userKey: keys.userKey,
    });

    return this.adapter;
  }

  /**
   * Reset the adapter (call when keys change)
   */
  reset(): void {
    this.adapter = null;
  }

  /**
   * Check if the service is ready (keys are configured)
   */
  isReady(): boolean {
    return keyManager.hasKeys();
  }

  /**
   * Configure the adapter with custom options
   */
  configure(config: Omit<RestAdapterConfig, 'apiKey' | 'userKey'>): void {
    const keys = keyManager.getKeys();
    if (!keys) {
      throw new ApiServiceError('API keys not configured. Please set keys using keyManager.setKeys()');
    }

    this.adapter = new RestAdapter({
      ...config,
      apiKey: keys.apiKey,
      userKey: keys.userKey,
    });
  }

  async get<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.ensureAdapter().get<T>(endpoint, options);
  }

  async post<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.ensureAdapter().post<T>(endpoint, body, options);
  }

  async put<T = unknown>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.ensureAdapter().put<T>(endpoint, body, options);
  }

  async delete<T = unknown>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.ensureAdapter().delete<T>(endpoint, options);
  }
}

let instance: ApiService | null = null;

export function getApiService(): ApiService {
  if (!instance) {
    instance = new ApiService();
  }
  return instance;
}

export function resetApiService(): void {
  if (instance) {
    instance.reset();
  }
  instance = null;
}
