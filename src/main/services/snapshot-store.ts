import { copyFile, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { SnapshotManifest, SnapshotQuotaSummary } from '@shared/types';
import { mapAccountSummary, parseAuthState } from './auth-state';

interface SnapshotStoreOptions {
  appDataDir: string;
  codexHomeDir: string;
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

  return {
    async captureCurrentAccount(label: string) {
      await ensureDir(snapshotsDir);
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
      await ensureDir(snapshotsDir);
      const entries = await readdir(snapshotsDir, { withFileTypes: true });
      const manifests = await Promise.all(
        entries
          .filter((entry) => entry.isDirectory())
          .map((entry) => readManifest(join(snapshotsDir, entry.name, 'manifest.json')))
      );

      return manifests.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },

    async readSnapshot(id: string) {
      const manifestPath = join(snapshotsDir, id, 'manifest.json');

      try {
        return await readManifest(manifestPath);
      } catch {
        throw new Error(`Snapshot ${id} not found`);
      }
    },

    async updateSnapshotQuota(id: string, quota: SnapshotQuotaSummary) {
      const manifestPath = join(snapshotsDir, id, 'manifest.json');
      const manifest = await readManifest(manifestPath);
      const updated: SnapshotManifest = {
        ...manifest,
        quota
      };
      await writeManifest(manifestPath, updated);
      return updated;
    },

    getSnapshotDir(id: string) {
      return join(snapshotsDir, id);
    }
  };
}
