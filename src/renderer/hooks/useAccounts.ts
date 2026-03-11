import { useEffect, useState } from 'react';
import type { DesktopInfo, LocalUsageSummary, SnapshotManifest } from '@shared/types';
import { getDesktopBridge, getDesktopBridgeError } from '../desktop-bridge';

function isCurrentSnapshot(snapshot: SnapshotManifest, usage: LocalUsageSummary | null) {
  if (usage?.accountSubject && snapshot.account.subject) {
    return usage.accountSubject === snapshot.account.subject;
  }

  return Boolean(usage?.accountEmail && usage.accountEmail === snapshot.account.email);
}

function getQuotaSortValue(snapshot: SnapshotManifest) {
  if (!snapshot.quota) {
    return null;
  }

  return Math.min(snapshot.quota.fiveHourRemainingPercent, snapshot.quota.weeklyRemainingPercent);
}

function sortAccountsForDisplay(accounts: SnapshotManifest[], usage: LocalUsageSummary | null) {
  return [...accounts].sort((left, right) => {
    const leftCurrent = isCurrentSnapshot(left, usage);
    const rightCurrent = isCurrentSnapshot(right, usage);

    if (leftCurrent !== rightCurrent) {
      return leftCurrent ? -1 : 1;
    }

    const leftQuotaValue = getQuotaSortValue(left);
    const rightQuotaValue = getQuotaSortValue(right);

    if (leftQuotaValue === null && rightQuotaValue !== null) {
      return 1;
    }

    if (leftQuotaValue !== null && rightQuotaValue === null) {
      return -1;
    }

    if (leftQuotaValue !== null && rightQuotaValue !== null && leftQuotaValue !== rightQuotaValue) {
      return rightQuotaValue - leftQuotaValue;
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<SnapshotManifest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usage, setUsage] = useState<LocalUsageSummary | null>(null);
  const [desktopInfo, setDesktopInfo] = useState<DesktopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedAccounts = sortAccountsForDisplay(accounts, usage);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const bridge = getDesktopBridge();
      if (!bridge) {
        throw new Error(getDesktopBridgeError());
      }

      const [desktopInfoResult, snapshotsResult, usageResult] = await Promise.allSettled([
        bridge.readDesktopInfo(),
        bridge.listSnapshots(),
        bridge.readLocalUsage()
      ]);

      if (desktopInfoResult.status === 'fulfilled') {
        setDesktopInfo(desktopInfoResult.value);
      }

      if (snapshotsResult.status === 'fulfilled') {
        setAccounts(snapshotsResult.value);
        setSelectedId((current) => current ?? snapshotsResult.value[0]?.id ?? null);
      }

      if (usageResult.status === 'fulfilled') {
        setUsage(usageResult.value);
      }

      const failure = [desktopInfoResult, snapshotsResult, usageResult].find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') {
        throw failure.reason;
      }
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
    accounts: sortedAccounts,
    selectedId,
    setSelectedId,
    usage,
    desktopInfo,
    loading,
    busyAction,
    error,
    bridgeAvailable: getDesktopBridge() !== null,
    selectedAccount: sortedAccounts.find((account) => account.id === selectedId) ?? sortedAccounts[0] ?? null,
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
    deleteSnapshot: (snapshotId: string) =>
      runAction(`delete:${snapshotId}`, async () => {
        const bridge = getDesktopBridge();
        if (!bridge) {
          throw new Error(getDesktopBridgeError());
        }

        await bridge.deleteSnapshot(snapshotId);
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
        for (const account of sortedAccounts) {
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
