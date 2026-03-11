import { useEffect, useState } from 'react';
import type { LocalUsageSummary, SnapshotManifest } from '@shared/types';
import { getDesktopBridge, getDesktopBridgeError } from '../desktop-bridge';

export function useAccounts() {
  const [accounts, setAccounts] = useState<SnapshotManifest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usage, setUsage] = useState<LocalUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const bridge = getDesktopBridge();
      if (!bridge) {
        throw new Error(getDesktopBridgeError());
      }

      const [snapshots, usageSummary] = await Promise.all([bridge.listSnapshots(), bridge.readLocalUsage()]);

      setAccounts(snapshots);
      setUsage(usageSummary);
      setSelectedId((current) => current ?? snapshots[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to load local Codex account data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function runAction(actionKey: string, operation: () => Promise<unknown>) {
    if (!getDesktopBridge()) {
      setError(getDesktopBridgeError());
      return;
    }

    setBusyAction(actionKey);
    setError(null);

    try {
      await operation();
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed.');
    } finally {
      setBusyAction(null);
    }
  }

  return {
    accounts,
    selectedId,
    setSelectedId,
    usage,
    loading,
    busyAction,
    error,
    bridgeAvailable: getDesktopBridge() !== null,
    selectedAccount: accounts.find((account) => account.id === selectedId) ?? accounts[0] ?? null,
    refresh,
    captureCurrentAccount: (label: string) =>
      runAction('capture', async () => {
        const bridge = getDesktopBridge();
        if (!bridge) {
          throw new Error(getDesktopBridgeError());
        }

        return bridge.captureCurrentAccount(label);
      }),
    switchToSnapshot: (snapshotId: string) =>
      runAction(`switch:${snapshotId}`, async () => {
        const bridge = getDesktopBridge();
        if (!bridge) {
          throw new Error(getDesktopBridgeError());
        }

        return bridge.switchToSnapshot(snapshotId);
      }),
    refreshSnapshotUsage: (snapshotId: string) =>
      runAction(`refresh:${snapshotId}`, async () => {
        const bridge = getDesktopBridge();
        if (!bridge) {
          throw new Error(getDesktopBridgeError());
        }

        return bridge.refreshSnapshotUsage(snapshotId);
      }),
    refreshAllSnapshotUsage: async () => {
      const bridge = getDesktopBridge();
      if (!bridge) {
        setError(getDesktopBridgeError());
        return;
      }

      setBusyAction('refresh-all');
      setError(null);

      const failures: string[] = [];

      try {
        for (const account of accounts) {
          try {
            await bridge.refreshSnapshotUsage(account.id);
          } catch {
            failures.push(account.label);
          }
        }

        await refresh();

        if (failures.length > 0) {
          setError(`${failures.length} quota refresh failed: ${failures.join(', ')}`);
        }
      } finally {
        setBusyAction(null);
      }
    },
    restoreLastBackup: () =>
      runAction('restore', async () => {
        const bridge = getDesktopBridge();
        if (!bridge) {
          throw new Error(getDesktopBridgeError());
        }

        return bridge.restoreLastBackup();
      })
  };
}
