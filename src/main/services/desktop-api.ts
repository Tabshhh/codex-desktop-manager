import { app } from 'electron';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CodexDesktopApi } from '../../shared/api';
import { mapAccountSummary, parseAuthState } from './auth-state';
import { locateCodexLaunchTarget, resolveCodexRuntimePaths } from './locator';
import { createWindowsProcessManager } from './process-manager';
import { getPlatformSupport } from './platform-support';
import { refreshUsageFromAuthFile } from './remote-usage';
import { createSnapshotStore } from './snapshot-store';
import { createSwitchService } from './switch-service';
import { summarizeLocalUsage } from './usage-service';

interface DesktopApiOptions {
  appDataDir: string;
}

export async function createDesktopApi(options: DesktopApiOptions): Promise<CodexDesktopApi> {
  const paths = resolveCodexRuntimePaths();
  const launchTarget = await locateCodexLaunchTarget();
  const snapshotStore = createSnapshotStore({
    appDataDir: options.appDataDir,
    codexHomeDir: paths.codexHomeDir,
    legacyAppDataDirs: [join(app.getPath('appData'), 'codex-account-switcher')]
  });
  const switchService = createSwitchService({
    codexHomeDir: paths.codexHomeDir,
    appDataDir: options.appDataDir,
    snapshotStore,
    processManager: createWindowsProcessManager({
      executablePath: launchTarget.executablePath ?? undefined,
      appUserModelId: launchTarget.appUserModelId ?? undefined
    })
  });

  return {
    readDesktopInfo: async () => ({
      productName: app.getName(),
      version: app.getVersion(),
      platform: getPlatformSupport()
    }),
    listSnapshots: () => snapshotStore.listSnapshots(),
    captureCurrentAccount: async (label: string) => {
      if (label.trim()) {
        return snapshotStore.captureCurrentAccount(label.trim());
      }

      const live = mapAccountSummary(parseAuthState(await readFile(`${paths.codexHomeDir}/auth.json`, 'utf8')));
      const fallbackLabel = live.displayName === live.email ? live.email : live.displayName;
      return snapshotStore.captureCurrentAccount(fallbackLabel);
    },
    switchToSnapshot: (snapshotId: string) => switchService.switchToSnapshot(snapshotId),
    refreshSnapshotUsage: async (snapshotId: string) => {
      const snapshotDir = snapshotStore.getSnapshotDir(snapshotId);
      const quota = await refreshUsageFromAuthFile(join(snapshotDir, 'auth.json'));
      return snapshotStore.updateSnapshotQuota(snapshotId, quota);
    },
    deleteSnapshot: (snapshotId: string) => snapshotStore.deleteSnapshot(snapshotId),
    restoreLastBackup: () => switchService.restoreLastBackup(),
    readLocalUsage: async () => {
      const live = mapAccountSummary(parseAuthState(await readFile(`${paths.codexHomeDir}/auth.json`, 'utf8')));
      return summarizeLocalUsage({
        sessionsDir: `${paths.codexHomeDir}/sessions`,
        logsDir: paths.localLogsDir,
        plan: live.plan,
        accountEmail: live.email,
        accountSubject: live.subject,
        lastRefresh: live.lastRefresh,
        tokenExpiry: live.tokenExpiry
      });
    }
  };
}
