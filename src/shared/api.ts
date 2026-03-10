import type { AccountSummary, LocalUsageSummary, SnapshotManifest } from './types';

export interface CodexDesktopApi {
  listSnapshots(): Promise<SnapshotManifest[]>;
  captureCurrentAccount(label: string): Promise<SnapshotManifest>;
  switchToSnapshot(snapshotId: string): Promise<SnapshotManifest>;
  restoreLastBackup(): Promise<AccountSummary>;
  readLocalUsage(): Promise<LocalUsageSummary>;
}
