import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { SnapshotManifest } from '@shared/types';
import { mapAccountSummary, parseAuthState } from './auth-state';
import type { ProcessManager } from './process-manager';

interface SnapshotStoreLike {
  readSnapshot(id: string): Promise<SnapshotManifest>;
  getSnapshotDir(id: string): string;
}

interface SwitchServiceOptions {
  codexHomeDir: string;
  appDataDir: string;
  snapshotStore: SnapshotStoreLike;
  processManager: ProcessManager;
}

const SNAPSHOT_FILES = ['auth.json', 'config.toml', '.codex-global-state.json'] as const;

async function exists(path: string) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function copyPresentFiles(sourceDir: string, destinationDir: string) {
  await mkdir(destinationDir, { recursive: true });

  for (const fileName of SNAPSHOT_FILES) {
    const source = join(sourceDir, fileName);
    if (await exists(source)) {
      await copyFile(source, join(destinationDir, fileName));
    }
  }
}

async function syncSnapshotFiles(sourceDir: string, destinationDir: string) {
  await mkdir(destinationDir, { recursive: true });

  for (const fileName of SNAPSHOT_FILES) {
    const source = join(sourceDir, fileName);
    const destination = join(destinationDir, fileName);

    if (await exists(source)) {
      await copyFile(source, destination);
    } else if (await exists(destination)) {
      await rm(destination, { force: true });
    }
  }
}

async function readLiveAccount(codexHomeDir: string) {
  const raw = await readFile(join(codexHomeDir, 'auth.json'), 'utf8');
  return mapAccountSummary(parseAuthState(raw));
}

export function createSwitchService(options: SwitchServiceOptions) {
  const backupsDir = join(options.appDataDir, 'backups');

  return {
    async switchToSnapshot(snapshotId: string) {
      const target = await options.snapshotStore.readSnapshot(snapshotId);
      const targetDir = options.snapshotStore.getSnapshotDir(snapshotId);
      const backupId = `backup-${Date.now()}`;
      const backupDir = join(backupsDir, backupId);

      await mkdir(backupsDir, { recursive: true });
      await copyPresentFiles(options.codexHomeDir, backupDir);
      await writeFile(join(backupsDir, 'latest.json'), JSON.stringify({ id: backupId }, null, 2));

      await options.processManager.stopCodex();
      await syncSnapshotFiles(targetDir, options.codexHomeDir);
      await options.processManager.startCodex();

      const live = await readLiveAccount(options.codexHomeDir);
      if (live.email !== target.account.email) {
        await syncSnapshotFiles(backupDir, options.codexHomeDir);
        await options.processManager.startCodex();
        throw new Error('Switch verification failed and was rolled back');
      }

      return target;
    },

    async restoreLastBackup() {
      const latest = JSON.parse(await readFile(join(backupsDir, 'latest.json'), 'utf8')) as { id: string };
      const backupDir = join(backupsDir, latest.id);

      await options.processManager.stopCodex();
      await syncSnapshotFiles(backupDir, options.codexHomeDir);
      await options.processManager.startCodex();

      return readLiveAccount(options.codexHomeDir);
    }
  };
}
