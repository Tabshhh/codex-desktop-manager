import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CodexRuntimePaths {
  codexHomeDir: string;
  roamingCodexDir: string;
  localLogsDir: string;
}

export interface CodexLaunchTarget {
  executablePath: string | null;
  appUserModelId: string | null;
}

export function resolveCodexRuntimePaths(userHome = homedir()): CodexRuntimePaths {
  const appData = process.env.APPDATA ?? join(userHome, 'AppData', 'Roaming');
  const localAppData = process.env.LOCALAPPDATA ?? join(userHome, 'AppData', 'Local');

  return {
    codexHomeDir: join(userHome, '.codex'),
    roamingCodexDir: join(appData, 'Codex'),
    localLogsDir: join(localAppData, 'Codex', 'Logs')
  };
}

async function firstNonEmptyLine(command: string, args: string[]) {
  const { stdout } = await execFileAsync(command, args);
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? null;
}

export async function locateCodexExecutable(): Promise<string | null> {
  try {
    const runningPath = await firstNonEmptyLine('powershell', [
      '-NoProfile',
      '-Command',
      "(Get-Process Codex -ErrorAction SilentlyContinue | Where-Object Path | Select-Object -First 1 -ExpandProperty Path)"
    ]);

    if (runningPath) {
      return runningPath;
    }
  } catch {
    // ignore
  }

  try {
    return await firstNonEmptyLine('where.exe', ['Codex.exe']);
  } catch {
    return null;
  }
}

export async function locateCodexAppUserModelId(): Promise<string | null> {
  try {
    return await firstNonEmptyLine('powershell', [
      '-NoProfile',
      '-Command',
      "(Get-StartApps | Where-Object { $_.AppID -like 'OpenAI.Codex*' } | Select-Object -First 1 -ExpandProperty AppID)"
    ]);
  } catch {
    return null;
  }
}

export async function locateCodexLaunchTarget(): Promise<CodexLaunchTarget> {
  const [executablePath, appUserModelId] = await Promise.all([locateCodexExecutable(), locateCodexAppUserModelId()]);
  return { executablePath, appUserModelId };
}
