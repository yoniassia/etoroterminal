interface ElectronSecureStorage {
  encrypt: (data: string) => Promise<string>;
  decrypt: (encryptedData: string) => Promise<string>;
  isAvailable: () => Promise<boolean>;
}

interface ElectronAPI {
  secureStorage: ElectronSecureStorage;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
