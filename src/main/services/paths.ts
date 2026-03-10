import { join } from 'node:path';
import { homedir } from 'node:os';

export function resolveCodexHome(root = homedir()) {
  return join(root, '.codex');
}

export function resolveAuthFile(root = homedir()) {
  return join(resolveCodexHome(root), 'auth.json');
}
