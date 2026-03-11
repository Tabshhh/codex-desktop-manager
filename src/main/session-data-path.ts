import { join } from 'node:path';
import { homedir } from 'node:os';

export function resolveSessionDataPath(
  appFolderName: string,
  env: NodeJS.ProcessEnv = process.env,
  userHome = homedir()
) {
  const localAppData = env.LOCALAPPDATA ?? join(userHome, 'AppData', 'Local');
  return join(localAppData, appFolderName, 'session-data');
}
