const { contextBridge, ipcRenderer } = require('electron');

// Required for your music player to fetch tracks from C:\Rishi\college\project\theroost\OSTs
contextBridge.exposeInMainWorld('api', {
    getAudioFiles: (folderPath) => ipcRenderer.invoke('get-audio-files', folderPath)
});

// Required for your custom title bar buttons
contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('window-minimize'),
    closeWindow: () => ipcRenderer.send('window-close')
});