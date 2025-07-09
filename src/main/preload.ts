/* eslint-disable object-shorthand */
// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import {
  contextBridge,
  ipcRenderer,
  IpcRendererEvent,
  desktopCapturer,
  screen,
} from 'electron';
import path from 'path';

export type Channels = 'ipc-example';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
    onResetArea: (callback: () => void) => {
      ipcRenderer.on('reset-area', () => {
        callback();
      });
    },
  },
  // 선택 영역 좌표를 메인에 전달
  sendCoords: (coords) => ipcRenderer.invoke('capture-region', coords),
  // 스크린샷 촬영을 위한 접근 권한 요청
  openPerms: () => ipcRenderer.send('open-permissions'),
  openSetup: () => ipcRenderer.invoke('open-setup'),
  endRecord: () => ipcRenderer.invoke('end-record'),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
