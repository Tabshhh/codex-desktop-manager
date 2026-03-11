import { BrowserWindow, app, ipcMain, screen } from 'electron';
import { join } from 'node:path';
import { registerIpcHandlers } from './ipc';
import { createDesktopApi } from './services/desktop-api';
import { loadWindowState, saveWindowState } from './window-state';
import { createMainWindowOptions } from './window-options';

let handlersRegistered = false;

async function createWindow() {
  const stateFilePath = join(app.getPath('userData'), 'window-state.json');
  const displays = screen.getAllDisplays().map((display) => display.workArea);
  const savedState = await loadWindowState(stateFilePath, displays);
  const window = new BrowserWindow(createMainWindowOptions(__dirname, savedState));

  if (savedState.isMaximized) {
    window.maximize();
  }

  window.on('close', () => {
    const bounds = window.isMaximized() ? window.getNormalBounds() : window.getBounds();
    void saveWindowState(stateFilePath, {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: window.isMaximized()
    });
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await window.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await window.loadFile(join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  if (!handlersRegistered) {
    const desktopApi = await createDesktopApi({ appDataDir: app.getPath('userData') });
    registerIpcHandlers(ipcMain, desktopApi);
    handlersRegistered = true;
  }

  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
