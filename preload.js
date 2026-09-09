const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getPonto: (data) => ipcRenderer.invoke('db:getPonto', data),
  savePonto: (ponto) => ipcRenderer.invoke('db:savePonto', ponto),
  savePontosBulk: (pontos) => ipcRenderer.invoke('db:savePontosBulk', pontos),
  getConfig: (chave) => ipcRenderer.invoke('db:getConfig', chave),
  setConfig: (chave, valor) => ipcRenderer.invoke('db:setConfig', { chave, valor }),
  getAllPontosMes: (anoMes) => ipcRenderer.invoke('db:getAllPontosMes', anoMes),
  hideWindow: () => ipcRenderer.invoke('app:hide'),
  minimizeWindow: () => ipcRenderer.invoke('app:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('app:maximize'),
  isMaximized: () => ipcRenderer.invoke('app:isMaximized'),
  onMaximizeChange: (cb) => ipcRenderer.on('app:maximize-changed', (_e, maximized) => cb(maximized)),
  closeWindow: () => ipcRenderer.invoke('app:close'),
  getToday: () => ipcRenderer.invoke('app:getToday'),
  isUtil: (data) => ipcRenderer.invoke('app:isUtil', data),
  getFeriado: (data) => ipcRenderer.invoke('app:getFeriado', data),
  exportBackup: () => ipcRenderer.invoke('db:exportBackup'),
  importBackup: () => ipcRenderer.invoke('db:importBackup'),
});
