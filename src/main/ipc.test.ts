import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS, registerIpcHandlers } from './ipc';

describe('ipc handlers', () => {
  it('registers bridge handlers and forwards to services', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (...args: unknown[]) => Promise<unknown>) => {
        handlers.set(channel, handler);
      })
    };
    const services = {
      readDesktopInfo: vi.fn(async () => ({ productName: 'Codex Desktop Manager', version: '0.1.0' })),
      listSnapshots: vi.fn(async () => [{ id: '1' }]),
      captureCurrentAccount: vi.fn(async (label: string) => ({ id: label })),
      switchToSnapshot: vi.fn(async (id: string) => ({ id })),
      deleteSnapshot: vi.fn(async () => undefined),
      restoreLastBackup: vi.fn(async () => ({ email: 'restored@example.com' })),
      readLocalUsage: vi.fn(async () => ({ freshness: 'fresh' })),
      refreshSnapshotUsage: vi.fn(async (id: string) => ({ id, quota: { fiveHourRemainingPercent: 60 } }))
    };

    registerIpcHandlers(ipcMain, services);

    expect(ipcMain.handle).toHaveBeenCalledTimes(8);
    await expect(handlers.get(IPC_CHANNELS.readDesktopInfo)?.()).resolves.toEqual({
      productName: 'Codex Desktop Manager',
      version: '0.1.0'
    });
    await expect(handlers.get(IPC_CHANNELS.listSnapshots)?.()).resolves.toEqual([{ id: '1' }]);
    await expect(handlers.get(IPC_CHANNELS.captureCurrentAccount)?.({}, 'Work')).resolves.toEqual({ id: 'Work' });
    await expect(handlers.get(IPC_CHANNELS.switchToSnapshot)?.({}, 'abc')).resolves.toEqual({ id: 'abc' });
    await expect(handlers.get(IPC_CHANNELS.restoreLastBackup)?.()).resolves.toEqual({ email: 'restored@example.com' });
    await expect(handlers.get(IPC_CHANNELS.readLocalUsage)?.()).resolves.toEqual({ freshness: 'fresh' });
    await expect(handlers.get(IPC_CHANNELS.refreshSnapshotUsage)?.({}, 'snap-1')).resolves.toEqual({
      id: 'snap-1',
      quota: { fiveHourRemainingPercent: 60 }
    });
    await expect(handlers.get(IPC_CHANNELS.deleteSnapshot)?.({}, 'snap-1')).resolves.toBeUndefined();
  });
});
