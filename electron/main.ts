import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import serve from 'electron-serve';
import { registerIpc } from './ipc/register';
import { mediaServer } from './media/media.sever';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadProd = serve({ directory: path.join(__dirname, '../out') });

async function createWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (app.isPackaged) {
    await loadProd(window);
  } else {
    await window.loadURL('http://localhost:3000');
    window.webContents.openDevTools();
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
