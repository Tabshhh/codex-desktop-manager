import { useEffect, useState } from 'react';
import type { LocalUsageSummary, SnapshotManifest } from '@shared/types';

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
      const [snapshots, usageSummary] = await Promise.all([
        window.codexSwitcher.listSnapshots(),
        window.codexSwitcher.readLocalUsage()
      ]);

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
    selectedAccount: accounts.find((account) => account.id === selectedId) ?? accounts[0] ?? null,
    refresh,
    captureCurrentAccount: (label: string) => runAction('capture', () => window.codexSwitcher.captureCurrentAccount(label)),
    switchToSnapshot: (snapshotId: string) => runAction(`switch:${snapshotId}`, () => window.codexSwitcher.switchToSnapshot(snapshotId)),
    restoreLastBackup: () => runAction('restore', () => window.codexSwitcher.restoreLastBackup())
  };
}
