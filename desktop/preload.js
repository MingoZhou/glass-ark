/* The only bridge between the game page and the desktop shell. The page sees window.arkDesktop and nothing else. */
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('arkDesktop', {
  setMode: m => ipcRenderer.send('desk:mode', String(m)),
  enterWidget: m => ipcRenderer.send('desk:enter', String(m)),
  exitWidget: m => ipcRenderer.send('desk:exit', String(m)),
  getWidget: () => ipcRenderer.invoke('desk:get'),
  setWidget: o => ipcRenderer.invoke('desk:set', o),
  toggleFullscreen: () => ipcRenderer.send('desk:fullscreen'),
  quit: () => ipcRenderer.send('desk:quit'),
});
