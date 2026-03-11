import type { IpcMain } from 'electron';
import type { CodexDesktopApi } from '@shared/api';

export const IPC_CHANNELS = {
  listSnapshots: 'codex-switcher:list-snapshots',
  captureCurrentAccount: 'codex-switcher:capture-current-account',
  switchToSnapshot: 'codex-switcher:switch-to-snapshot',
  refreshSnapshotUsage: 'codex-switcher:refresh-snapshot-usage',
  restoreLastBackup: 'codex-switcher:restore-last-backup',
  readLocalUsage: 'codex-switcher:read-local-usage'
} as const;

type IpcMainLike = Pick<IpcMain, 'handle'>;

export function registerIpcHandlers(ipcMain: IpcMainLike, services: CodexDesktopApi) {
  ipcMain.handle(IPC_CHANNELS.listSnapshots, () => services.listSnapshots());
  ipcMain.handle(IPC_CHANNELS.captureCurrentAccount, (_event, label: string) => services.captureCurrentAccount(label));
  ipcMain.handle(IPC_CHANNELS.switchToSnapshot, (_event, snapshotId: string) => services.switchToSnapshot(snapshotId));
  ipcMain.handle(IPC_CHANNELS.refreshSnapshotUsage, (_event, snapshotId: string) => services.refreshSnapshotUsage(snapshotId));
  ipcMain.handle(IPC_CHANNELS.restoreLastBackup, () => services.restoreLastBackup());
  ipcMain.handle(IPC_CHANNELS.readLocalUsage, () => services.readLocalUsage());
}
