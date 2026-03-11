import { describe, expect, it, vi } from 'vitest';
import { createWindowsProcessManager } from './process-manager';

describe('windows process manager', () => {
  it('launches Codex Desktop through the packaged app id when available', async () => {
    const run = vi.fn(async () => ({ stdout: '', stderr: '' }));
    const manager = createWindowsProcessManager({
      appUserModelId: 'OpenAI.Codex_2p2nqsd0c76g0!App',
      executablePath: 'C:\\Program Files\\WindowsApps\\OpenAI.Codex\\Codex.exe',
      run
    });

    await manager.startCodex();

    expect(run).toHaveBeenCalledWith('cmd.exe', ['/c', 'start', '', 'shell:AppsFolder\\OpenAI.Codex_2p2nqsd0c76g0!App']);
  });

  it('falls back to the executable path when no packaged app id is available', async () => {
    const run = vi.fn(async () => ({ stdout: '', stderr: '' }));
    const manager = createWindowsProcessManager({
      executablePath: 'C:\\Program Files\\Codex\\Codex.exe',
      run
    });

    await manager.startCodex();

    expect(run).toHaveBeenCalledWith('powershell', [
      '-NoProfile',
      '-Command',
      "Start-Process -FilePath 'C:\\Program Files\\Codex\\Codex.exe'"
    ]);
  });

  it('falls back to the executable path when the packaged app launch command fails', async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error('cmd start failed'))
      .mockResolvedValueOnce({ stdout: '', stderr: '' });
    const manager = createWindowsProcessManager({
      appUserModelId: 'OpenAI.Codex_2p2nqsd0c76g0!App',
      executablePath: 'C:\\Program Files\\Codex\\Codex.exe',
      run
    });

    await manager.startCodex();

    expect(run).toHaveBeenNthCalledWith(1, 'cmd.exe', ['/c', 'start', '', 'shell:AppsFolder\\OpenAI.Codex_2p2nqsd0c76g0!App']);
    expect(run).toHaveBeenNthCalledWith(2, 'powershell', [
      '-NoProfile',
      '-Command',
      "Start-Process -FilePath 'C:\\Program Files\\Codex\\Codex.exe'"
    ]);
  });
});
