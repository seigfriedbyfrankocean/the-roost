const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 700,  // Prevents shrinking width past 700px
        minHeight: 500, // Prevents shrinking height past 500px
        icon: path.join(__dirname, 'isabelle.jpg'),
        frame: false, // Keeps your custom title bar
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        title: "The Roost"
    });

    mainWindow.loadFile('index.html');
}


app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.stop ? app.stop() : app.quit();
});

ipcMain.on('window-minimize', (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.minimize();
});

ipcMain.on('window-close', (event) => {
    const webContents = event.sender;
    const win = BrowserWindow.fromWebContents(webContents);
    win.close();
});

// Secure backend handler to read audio folders dynamically from outside or inside the app package
ipcMain.handle('get-audio-files', async (event, folderPath) => {
    try {
        const basePath = app.isPackaged 
            ? path.join(path.dirname(process.execPath), '..', '..') // Goes up from win-unpacked -> dist -> theroost
            : __dirname;

        const fullDirPath = path.join(basePath, folderPath);
        console.log("Attempting to read directory:", fullDirPath);

        const files = fs.readdirSync(fullDirPath);
        console.log("Found files:", files.length);
        
        return files
            .filter(file => ['.mp3', '.flac', '.wav', '.ogg'].includes(path.extname(file).toLowerCase()))
            .map(file => {
                const absolutePath = path.join(fullDirPath, file);
                return url.pathToFileURL(absolutePath).href;
            });
    } catch (err) {
        console.error("Error reading directory:", err);
        return [];
    }
});