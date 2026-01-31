/**
 * Secure key manager service for storing API credentials
 * - In-memory storage by default (no persistence)
 * - Optional encrypted localStorage persistence
 * - Panic lock to clear all credentials instantly
 * - Never logs or exposes actual key values
 */

import { encrypt, decrypt } from './crypto';

const STORAGE_KEY = 'etoro_encrypted_keys';

export interface StoredKeys {
  userKey: string;
  apiKey: string;
  username?: string;
  fullName?: string;
}

class KeyManager {
  private keys: StoredKeys | null = null;

  /**
   * Store credentials in memory
   */
  setKeys(userKey: string, apiKey: string, username?: string, fullName?: string): void {
    this.keys = { userKey, apiKey, username, fullName };
  }

  /**
   * Update user info only
   */
  setUserInfo(username: string, fullName: string): void {
    if (this.keys) {
      this.keys.username = username;
      this.keys.fullName = fullName;
    }
  }

  /**
   * Get user display info
   */
  getUserInfo(): { username: string; fullName: string } | null {
    if (this.keys?.username || this.keys?.fullName) {
      return {
        username: this.keys.username || '',
        fullName: this.keys.fullName || '',
      };
    }
    return null;
  }

  /**
   * Get stored credentials
   * Returns null if no credentials are stored
   */
  getKeys(): StoredKeys | null {
    return this.keys ? { ...this.keys } : null;
  }

  /**
   * Check if credentials are stored
   */
  hasKeys(): boolean {
    return this.keys !== null;
  }

  /**
   * Clear all credentials from memory and localStorage (panic lock)
   */
  clearKeys(): void {
    this.keys = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage may not be available
    }
  }

  /**
   * Encrypt and persist credentials to localStorage
   * Requires a user-provided passphrase
   */
  async persistKeys(passphrase: string): Promise<void> {
    if (!this.keys) {
      throw new Error('No keys to persist');
    }

    if (!passphrase || passphrase.length < 8) {
      throw new Error('Passphrase must be at least 8 characters');
    }

    const payload = JSON.stringify(this.keys);
    const encrypted = await encrypt(payload, passphrase);
    localStorage.setItem(STORAGE_KEY, encrypted);
  }

  /**
   * Load and decrypt credentials from localStorage
   * Requires the same passphrase used to persist
   */
  async loadKeys(passphrase: string): Promise<boolean> {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) {
      return false;
    }

    try {
      const decrypted = await decrypt(encrypted, passphrase);
      const parsed = JSON.parse(decrypted) as StoredKeys;

      if (parsed.userKey && parsed.apiKey) {
        this.keys = parsed;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if encrypted keys exist in localStorage
   */
  hasPersistedKeys(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }
}

export const keyManager = new KeyManager();
