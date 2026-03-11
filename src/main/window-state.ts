import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowState extends WindowBounds {
  isMaximized: boolean;
}

export const defaultWindowState: WindowState = {
  width: 1200,
  height: 780,
  x: 120,
  y: 80,
  isMaximized: false
};

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isVisibleOnDisplay(bounds: WindowBounds, displays: WindowBounds[]) {
  return displays.some((display) => {
    const right = Math.min(bounds.x + bounds.width, display.x + display.width);
    const bottom = Math.min(bounds.y + bounds.height, display.y + display.height);
    const left = Math.max(bounds.x, display.x);
    const top = Math.max(bounds.y, display.y);

    return right > left && bottom > top;
  });
}

function parseWindowState(raw: string): WindowState | null {
  const parsed = JSON.parse(raw) as Partial<WindowState>;

  if (!isNumber(parsed.width) || !isNumber(parsed.height) || !isNumber(parsed.x) || !isNumber(parsed.y)) {
    return null;
  }

  if (parsed.width < defaultWindowState.width * 0.5 || parsed.height < defaultWindowState.height * 0.5) {
    return null;
  }

  return {
    width: parsed.width,
    height: parsed.height,
    x: parsed.x,
    y: parsed.y,
    isMaximized: Boolean(parsed.isMaximized)
  };
}

export async function loadWindowState(filePath: string, displays: WindowBounds[]): Promise<WindowState> {
  try {
    const parsed = parseWindowState(await readFile(filePath, 'utf8'));
    if (!parsed) {
      return defaultWindowState;
    }

    return isVisibleOnDisplay(parsed, displays) ? parsed : defaultWindowState;
  } catch {
    return defaultWindowState;
  }
}

export async function saveWindowState(filePath: string, state: WindowState): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
}
