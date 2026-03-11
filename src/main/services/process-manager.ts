import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

type ExecFileLike = (file: string, args: string[]) => Promise<{ stdout: string; stderr: string }>;

export interface ProcessManager {
  stopCodex(): Promise<void>;
  startCodex(): Promise<void>;
}

interface WindowsProcessManagerOptions {
  executablePath?: string;
  appUserModelId?: string;
  run?: ExecFileLike;
}

export function createWindowsProcessManager(options: WindowsProcessManagerOptions = {}): ProcessManager {
  const run = options.run ?? execFileAsync;

  return {
    async stopCodex() {
      await run('taskkill', ['/IM', 'Codex.exe', '/F']).catch(() => undefined);
      await run('taskkill', ['/IM', 'codex.exe', '/F']).catch(() => undefined);
    },

    async startCodex() {
      if (options.appUserModelId) {
        try {
          await run('cmd.exe', ['/c', 'start', '', `shell:AppsFolder\\${options.appUserModelId}`]);
          return;
        } catch {
          // fall through to the executable-path launcher below
        }
      }

      if (!options.executablePath) {
        return;
      }

      await run('powershell', ['-NoProfile', '-Command', `Start-Process -FilePath '${options.executablePath.replace(/'/g, "''")}'`]);
    }
  };
}
