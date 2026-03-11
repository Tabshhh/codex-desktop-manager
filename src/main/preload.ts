import { contextBridge, ipcRenderer } from 'electron';
import type { CodexDesktopApi } from '@shared/api';
import { IPC_CHANNELS } from './ipc';

const api: CodexDesktopApi = {
  listSnapshots: () => ipcRenderer.invoke(IPC_CHANNELS.listSnapshots),
  captureCurrentAccount: (label) => ipcRenderer.invoke(IPC_CHANNELS.captureCurrentAccount, label),
  switchToSnapshot: (snapshotId) => ipcRenderer.invoke(IPC_CHANNELS.switchToSnapshot, snapshotId),
  refreshSnapshotUsage: (snapshotId) => ipcRenderer.invoke(IPC_CHANNELS.refreshSnapshotUsage, snapshotId),
  restoreLastBackup: () => ipcRenderer.invoke(IPC_CHANNELS.restoreLastBackup),
  readLocalUsage: () => ipcRenderer.invoke(IPC_CHANNELS.readLocalUsage)
};

contextBridge.exposeInMainWorld('codexSwitcher', api);
