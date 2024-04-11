const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  saveConfig: (config) => ipcRenderer.invoke('config:save', config),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  clearConfig: (configNumber) =>
    ipcRenderer.invoke('config:clear', configNumber),
  exit: () => ipcRenderer.invoke('config:exit'),
});
