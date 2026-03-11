import { copyFile, cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SnapshotManifest, SnapshotQuotaSummary } from '@shared/types';
import { mapAccountSummary, parseAuthState } from './auth-state';

interface SnapshotStoreOptions {
  appDataDir: string;
  codexHomeDir: string;
  legacyAppDataDirs?: string[];
}

const SNAPSHOT_FILES = ['auth.json', 'config.toml', '.codex-global-state.json'] as const;

async function ensureDir(path: string) {
  await mkdir(path, { recursive: true });
}

async function safeCopyIfPresent(source: string, destination: string) {
  try {
    await stat(source);
    await copyFile(source, destination);
  } catch {
    // ignore optional files
  }
}

async function readManifest(path: string) {
  const manifest = JSON.parse(await readFile(path, 'utf8')) as SnapshotManifest;

  if (!manifest.id || !manifest.label || !manifest.account?.email || !manifest.account?.displayName) {
    throw new Error('Snapshot manifest is incomplete');
  }

  return {
    ...manifest,
    quota: manifest.quota ?? null
  } satisfies SnapshotManifest;
}

async function writeManifest(path: string, manifest: SnapshotManifest) {
  await writeFile(path, JSON.stringify(manifest, null, 2));
}

export function createSnapshotStore(options: SnapshotStoreOptions) {
  const snapshotsDir = join(options.appDataDir, 'snapshots');
  let prepared = false;

  async function migrateLegacySnapshots() {
    if (!options.legacyAppDataDirs || options.legacyAppDataDirs.length === 0) {
      return;
    }

    for (const legacyAppDataDir of options.legacyAppDataDirs) {
      const legacySnapshotsDir = join(legacyAppDataDir, 'snapshots');

      try {
        const legacyEntries = await readdir(legacySnapshotsDir, { withFileTypes: true });
        const snapshotEntries = legacyEntries.filter((entry) => entry.isDirectory());

        if (snapshotEntries.length === 0) {
          continue;
        }

        for (const entry of snapshotEntries) {
          await cp(join(legacySnapshotsDir, entry.name), join(snapshotsDir, entry.name), {
            recursive: true,
            force: false,
            errorOnExist: false
          });
        }

        return;
      } catch {
        // ignore missing legacy snapshot directories
      }
    }
  }

  async function ensureSnapshotsReady() {
    if (prepared) {
      return;
    }

    await ensureDir(snapshotsDir);
    await migrateLegacySnapshots();
    prepared = true;
  }

  return {
    async captureCurrentAccount(label: string) {
      await ensureSnapshotsReady();
      const authPath = join(options.codexHomeDir, 'auth.json');
      const authRaw = await readFile(authPath, 'utf8');
      const account = mapAccountSummary(parseAuthState(authRaw));
      const id = randomUUID();
      const snapshotDir = join(snapshotsDir, id);
      const createdAt = new Date().toISOString();
      const manifest: SnapshotManifest = {
        id,
        label,
        createdAt,
        updatedAt: createdAt,
        account,
        quota: null
      };

      await ensureDir(snapshotDir);
      for (const fileName of SNAPSHOT_FILES) {
        await safeCopyIfPresent(join(options.codexHomeDir, fileName), join(snapshotDir, fileName));
      }
      await writeManifest(join(snapshotDir, 'manifest.json'), manifest);

      return manifest;
    },

    async listSnapshots() {
      await ensureSnapshotsReady();
      const entries = await readdir(snapshotsDir, { withFileTypes: true });
      const manifests = (
        await Promise.all(
          entries
            .filter((entry) => entry.isDirectory())
            .map(async (entry) => {
              try {
                return await readManifest(join(snapshotsDir, entry.name, 'manifest.json'));
              } catch {
                return null;
              }
            })
        )
      ).filter((manifest): manifest is SnapshotManifest => manifest !== null);

      return manifests.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },

    async readSnapshot(id: string) {
      await ensureSnapshotsReady();
      const manifestPath = join(snapshotsDir, id, 'manifest.json');

      try {
        return await readManifest(manifestPath);
      } catch {
        throw new Error(`Snapshot ${id} not found`);
      }
    },

    async updateSnapshotQuota(id: string, quota: SnapshotQuotaSummary) {
      await ensureSnapshotsReady();
      const manifestPath = join(snapshotsDir, id, 'manifest.json');
      const manifest = await readManifest(manifestPath);
      const updated: SnapshotManifest = {
        ...manifest,
        quota
      };
      await writeManifest(manifestPath, updated);
      return updated;
    },

    async deleteSnapshot(id: string) {
      await ensureSnapshotsReady();
      await rm(join(snapshotsDir, id), { recursive: true, force: true });
    },

    getSnapshotDir(id: string) {
      return join(snapshotsDir, id);
    }
  };
}
