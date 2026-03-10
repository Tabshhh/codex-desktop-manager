import { readFile } from 'node:fs/promises';
import type { CodexDesktopApi } from '../../shared/api';
import { mapAccountSummary, parseAuthState } from './auth-state';
import { locateCodexExecutable, resolveCodexRuntimePaths } from './locator';
import { createWindowsProcessManager } from './process-manager';
import { createSnapshotStore } from './snapshot-store';
import { createSwitchService } from './switch-service';
import { summarizeLocalUsage } from './usage-service';

interface DesktopApiOptions {
  appDataDir: string;
}

export async function createDesktopApi(options: DesktopApiOptions): Promise<CodexDesktopApi> {
  const paths = resolveCodexRuntimePaths();
  const executablePath = await locateCodexExecutable();
  const snapshotStore = createSnapshotStore({
    appDataDir: options.appDataDir,
    codexHomeDir: paths.codexHomeDir
  });
  const switchService = createSwitchService({
    codexHomeDir: paths.codexHomeDir,
    appDataDir: options.appDataDir,
    snapshotStore,
    processManager: createWindowsProcessManager({ executablePath: executablePath ?? undefined })
  });

  return {
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
    restoreLastBackup: () => switchService.restoreLastBackup(),
    readLocalUsage: async () => {
      const live = mapAccountSummary(parseAuthState(await readFile(`${paths.codexHomeDir}/auth.json`, 'utf8')));
      return summarizeLocalUsage({
        sessionsDir: `${paths.codexHomeDir}/sessions`,
        logsDir: paths.localLogsDir,
        plan: live.plan,
        lastRefresh: live.lastRefresh,
        tokenExpiry: live.tokenExpiry
      });
    }
  };
}
