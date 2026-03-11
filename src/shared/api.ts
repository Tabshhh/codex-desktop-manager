import type { AccountSummary, DesktopInfo, LocalUsageSummary, SnapshotManifest } from './types';

export interface CodexDesktopApi {
  readDesktopInfo(): Promise<DesktopInfo>;
  listSnapshots(): Promise<SnapshotManifest[]>;
  captureCurrentAccount(label: string): Promise<SnapshotManifest>;
  switchToSnapshot(snapshotId: string): Promise<SnapshotManifest>;
  refreshSnapshotUsage(snapshotId: string): Promise<SnapshotManifest>;
  restoreLastBackup(): Promise<AccountSummary>;
  readLocalUsage(): Promise<LocalUsageSummary>;
}
