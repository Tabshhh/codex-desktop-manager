import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface ProcessManager {
  stopCodex(): Promise<void>;
  startCodex(): Promise<void>;
}

interface WindowsProcessManagerOptions {
  executablePath?: string;
}

export function createWindowsProcessManager(options: WindowsProcessManagerOptions = {}): ProcessManager {
  return {
    async stopCodex() {
      await execFileAsync('taskkill', ['/IM', 'Codex.exe', '/F']).catch(() => undefined);
      await execFileAsync('taskkill', ['/IM', 'codex.exe', '/F']).catch(() => undefined);
    },

    async startCodex() {
      if (!options.executablePath) {
        return;
      }

      await execFileAsync('powershell', ['-NoProfile', '-Command', `Start-Process -FilePath '${options.executablePath.replace(/'/g, "''")}'`]);
    }
  };
}
