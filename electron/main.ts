import { app, BrowserWindow, nativeTheme } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import serve from 'electron-serve';
import { registerIpc } from './ipc/register';
import { mediaServer } from './media/media.sever';
import { settingsService } from './services/SettingsService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadProd = serve({ directory: path.join(__dirname, '../out') });

let mainWindow: BrowserWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  nativeTheme.themeSource = settingsService.getTheme();

  const handleThemeUpdated = () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      return;
    }

    mainWindow.webContents.send(
      'system-theme-changed',
      nativeTheme.shouldUseDarkColors ? 'dark' : 'light',
    );
  };

  nativeTheme.on('updated', handleThemeUpdated);

  if (app.isPackaged) {
    await loadProd(mainWindow);
  } else {
    await mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  mediaServer.start();

  registerIpc();

  await createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
