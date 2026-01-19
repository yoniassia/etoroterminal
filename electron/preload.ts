import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  secureStorage: {
    encrypt: (data: string): Promise<string> => 
      ipcRenderer.invoke('secure-storage:encrypt', data),
    decrypt: (encryptedData: string): Promise<string> => 
      ipcRenderer.invoke('secure-storage:decrypt', encryptedData),
    isAvailable: (): Promise<boolean> => 
      ipcRenderer.invoke('secure-storage:isAvailable'),
  },
  isElectron: true,
});
